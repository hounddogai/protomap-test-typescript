import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveWarmupMappingReport } from "./adaptive-warmup-mapping-report.js";
import { AdaptiveWarmupMapping, newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

test("AdaptiveWarmupMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_514_273);
  const items: AdaptiveWarmupMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveWarmupMapping(`adaptive-warmup-mapping-${index}`, "sample"));
  }
  const report = buildAdaptiveWarmupMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
