import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationScoreReport } from "./activation-score-report.js";
import { ActivationScore, newActivationScore } from "./activation-score.js";

test("ActivationScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_039_557);
  const items: ActivationScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationScore(`activation-score-${index}`, "sample"));
  }
  const report = buildActivationScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
