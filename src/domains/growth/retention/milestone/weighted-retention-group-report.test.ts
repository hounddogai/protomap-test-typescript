import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRetentionGroupReport } from "./weighted-retention-group-report.js";
import { WeightedRetentionGroup, newWeightedRetentionGroup } from "./weighted-retention-group.js";

test("WeightedRetentionGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_693_181);
  const items: WeightedRetentionGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedRetentionGroup(`weighted-retention-group-${index}`, "sample"));
  }
  const report = buildWeightedRetentionGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
