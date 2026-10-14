import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFunnelManifestReport } from "./manual-funnel-manifest-report.js";
import { ManualFunnelManifest, newManualFunnelManifest } from "./manual-funnel-manifest.js";

test("ManualFunnelManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_729_758);
  const items: ManualFunnelManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualFunnelManifest(`manual-funnel-manifest-${index}`, "sample"));
  }
  const report = buildManualFunnelManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
