import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSuppressionMappingReport } from "./adaptive-suppression-mapping-report.js";
import { AdaptiveSuppressionMapping, newAdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

test("AdaptiveSuppressionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_165_175);
  const items: AdaptiveSuppressionMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveSuppressionMapping(`adaptive-suppression-mapping-${index}`, "sample"));
  }
  const report = buildAdaptiveSuppressionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
