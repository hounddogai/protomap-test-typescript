import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRewardScoreReport } from "./lenient-reward-score-report.js";
import { LenientRewardScore, newLenientRewardScore } from "./lenient-reward-score.js";

test("LenientRewardScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_337_424);
  const items: LenientRewardScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientRewardScore(`lenient-reward-score-${index}`, "sample"));
  }
  const report = buildLenientRewardScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
