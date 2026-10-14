import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedReplyTargetReport } from "./weighted-reply-target-report.js";
import { WeightedReplyTarget, newWeightedReplyTarget } from "./weighted-reply-target.js";

test("WeightedReplyTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_466_046);
  const items: WeightedReplyTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedReplyTarget(`weighted-reply-target-${index}`, "sample"));
  }
  const report = buildWeightedReplyTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
