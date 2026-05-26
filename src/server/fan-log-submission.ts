import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getPrismaClient } from "@/server/prisma";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export class FanLogConfigError extends Error {}
export class LocalityNotFoundError extends Error {}
export class SubmissionRateLimitError extends Error {}
export class TurnstileVerificationError extends Error {
  constructor(public readonly codes: string[]) {
    super("Turnstile verification failed.");
  }
}

type SubmitFanLogInput = {
  localityId: bigint;
  pseudo: string;
  anecdote?: string;
  remark?: string;
  ipHash: string;
  userAgentHash: string;
};

function normalizeHeaderValue(value: string | null): string {
  return value?.trim() || "unknown";
}

export function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
    if (firstForwardedIp) {
      return firstForwardedIp;
    }
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  return cloudflareIp?.trim() || null;
}

export function hashRequestValue(value: string): string {
  const hashSalt = process.env.REQUEST_HASH_SALT ?? "";

  return createHash("sha256")
    .update(`${hashSalt}:${normalizeHeaderValue(value)}`)
    .digest("hex");
}

export async function verifyTurnstileToken({
  token,
  ipAddress,
}: {
  token: string;
  ipAddress: string | null;
}): Promise<void> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    throw new FanLogConfigError("TURNSTILE_SECRET_KEY is not configured.");
  }

  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (ipAddress) {
    payload.set("remoteip", ipAddress);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Turnstile verify request failed with ${response.status}.`);
  }

  const result = (await response.json()) as {
    success?: boolean;
    [key: string]: unknown;
    "error-codes"?: string[];
  };

  if (!result.success) {
    throw new TurnstileVerificationError(result["error-codes"] ?? []);
  }
}

export async function submitFanLog({
  localityId,
  pseudo,
  anecdote,
  remark,
  ipHash,
  userAgentHash,
}: SubmitFanLogInput): Promise<{ fanCount: number }> {
  const recentSubmissionCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const locality = await tx.locality.findUnique({
      where: { id: localityId },
      select: { id: true },
    });

    if (!locality) {
      throw new LocalityNotFoundError("Locality not found.");
    }

    const recentSubmission = await tx.fanLog.findFirst({
      where: {
        localityId,
        ipHash,
        userAgentHash,
        createdAt: {
          gte: recentSubmissionCutoff,
        },
      },
      select: { id: true },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentSubmission) {
      throw new SubmissionRateLimitError("Repeated submission blocked.");
    }

    await tx.fanLog.create({
      data: {
        localityId,
        pseudo,
        anecdote,
        remark,
        ipHash,
        userAgentHash,
      },
    });

    const updatedFanCount = await tx.localityFanCount.upsert({
      where: { localityId },
      create: {
        localityId,
        fanCount: 1,
      },
      update: {
        fanCount: {
          increment: 1,
        },
      },
      select: {
        fanCount: true,
      },
    });

    return updatedFanCount;
  });
}