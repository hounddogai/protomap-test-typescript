import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictFunnelBundleReport } from "./strict-funnel-bundle-report.js";
import { StrictFunnelBundle, newStrictFunnelBundle } from "./strict-funnel-bundle.js";

test("StrictFunnelBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_199_674);
  const items: StrictFunnelBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictFunnelBundle(`strict-funnel-bundle-${index}`, "sample"));
  }
  const report = buildStrictFunnelBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
