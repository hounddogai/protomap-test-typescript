import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFunnelManifestReport } from "./scheduled-funnel-manifest-report.js";
import { ScheduledFunnelManifest, newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("ScheduledFunnelManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_767_033);
  const items: ScheduledFunnelManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledFunnelManifest(`scheduled-funnel-manifest-${index}`, "sample"));
  }
  const report = buildScheduledFunnelManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
