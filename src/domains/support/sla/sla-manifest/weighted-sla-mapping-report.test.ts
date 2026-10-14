import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedSlaMappingReport } from "./weighted-sla-mapping-report.js";
import { WeightedSlaMapping, newWeightedSlaMapping } from "./weighted-sla-mapping.js";

test("WeightedSlaMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_468_551);
  const items: WeightedSlaMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedSlaMapping(`weighted-sla-mapping-${index}`, "sample"));
  }
  const report = buildWeightedSlaMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
