import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import {
  extractClientIp,
  FanLogConfigError,
  hashRequestValue,
  LocalityNotFoundError,
  SubmissionRateLimitError,
  submitFanLog,
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/server/fan-log-submission";

const fanLogInputSchema = z.object({
  localityId: z.union([
    z.string().regex(/^\d+$/),
    z.number().int().positive(),
  ]).transform((value) => BigInt(value)),
  pseudo: z.string().trim().min(1).max(80),
  anecdote: z.string().trim().max(2000).optional().transform(emptyStringToUndefined),
  remark: z.string().trim().max(2000).optional().transform(emptyStringToUndefined),
  captchaToken: z.string().trim().min(1),
});

function emptyStringToUndefined(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsedInput = fanLogInputSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        error: "Invalid fan log payload.",
        details: parsedInput.error.flatten(),
      },
      { status: 400 },
    );
  }

  const clientIp = extractClientIp(request);
  const userAgent = request.headers.get("user-agent");

  try {
    await verifyTurnstileToken({
      token: parsedInput.data.captchaToken,
      ipAddress: clientIp,
    });

    const result = await submitFanLog({
      localityId: parsedInput.data.localityId,
      pseudo: parsedInput.data.pseudo,
      anecdote: parsedInput.data.anecdote,
      remark: parsedInput.data.remark,
      ipHash: hashRequestValue(clientIp ?? "unknown-ip"),
      userAgentHash: hashRequestValue(userAgent ?? "unknown-user-agent"),
    });

    return NextResponse.json(
      {
        fanCount: result.fanCount,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof TurnstileVerificationError) {
      return NextResponse.json(
        {
          error: "Captcha verification failed.",
          codes: error.codes,
        },
        { status: 400 },
      );
    }

    if (error instanceof SubmissionRateLimitError) {
      return NextResponse.json(
        {
          error: "Too many repeated submissions. Try again later.",
        },
        { status: 429 },
      );
    }

    if (error instanceof LocalityNotFoundError) {
      return NextResponse.json(
        {
          error: "Locality not found.",
        },
        { status: 404 },
      );
    }

    if (error instanceof FanLogConfigError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to submit fan log.",
      },
      { status: 500 },
    );
  }
}