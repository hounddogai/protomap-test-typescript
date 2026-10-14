import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedCreativeEntryReport } from "./weighted-creative-entry-report.js";
import { WeightedCreativeEntry, newWeightedCreativeEntry } from "./weighted-creative-entry.js";

test("WeightedCreativeEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_225_034);
  const items: WeightedCreativeEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedCreativeEntry(`weighted-creative-entry-${index}`, "sample"));
  }
  const report = buildWeightedCreativeEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
