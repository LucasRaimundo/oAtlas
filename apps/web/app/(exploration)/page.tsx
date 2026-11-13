import { preconnect } from "react-dom";

import { GlobeViewport } from "@/components/globe/GlobeViewport";

const GLOBE_ORIGINS = ["https://api.cesium.com", "https://dev.virtualearth.net"];

export default function ExplorationPage() {
  for (const origin of GLOBE_ORIGINS) preconnect(origin, { crossOrigin: "anonymous" });

  return (
    <main className="h-full">
      <GlobeViewport />
    </main>
  );
}
