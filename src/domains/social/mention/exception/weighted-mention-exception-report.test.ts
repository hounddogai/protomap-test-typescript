import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedMentionExceptionReport } from "./weighted-mention-exception-report.js";
import { WeightedMentionException, newWeightedMentionException } from "./weighted-mention-exception.js";

test("WeightedMentionExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_484_856);
  const items: WeightedMentionException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedMentionException(`weighted-mention-exception-${index}`, "sample"));
  }
  const report = buildWeightedMentionExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
