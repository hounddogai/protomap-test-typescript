import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedMentionCycleReport } from "./weighted-mention-cycle-report.js";
import { WeightedMentionCycle, newWeightedMentionCycle } from "./weighted-mention-cycle.js";

test("WeightedMentionCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_874_511);
  const items: WeightedMentionCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedMentionCycle(`weighted-mention-cycle-${index}`, "sample"));
  }
  const report = buildWeightedMentionCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
