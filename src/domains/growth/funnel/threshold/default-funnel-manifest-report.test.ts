import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFunnelManifestReport } from "./default-funnel-manifest-report.js";
import { DefaultFunnelManifest, newDefaultFunnelManifest } from "./default-funnel-manifest.js";

test("DefaultFunnelManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_437_773);
  const items: DefaultFunnelManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultFunnelManifest(`default-funnel-manifest-${index}`, "sample"));
  }
  const report = buildDefaultFunnelManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
