import { HomeMapShell } from "@/components/home-map-shell";
import { buildOfficialFallbackLocalities } from "@/lib/placeholder-localities";
import { listHomeLocalities } from "@/server/localities";

export default async function Home() {
  const initialLocalities = await listHomeLocalities("FR").catch(async () => {
    return buildOfficialFallbackLocalities();
  });

  const resolvedLocalities =
    initialLocalities.length > 0
      ? initialLocalities
      : await buildOfficialFallbackLocalities();

  return <HomeMapShell initialLocalities={resolvedLocalities} />;
}
