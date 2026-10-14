import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRetentionScoreReport } from "./tiered-retention-score-report.js";
import { TieredRetentionScore, newTieredRetentionScore } from "./tiered-retention-score.js";

test("TieredRetentionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_666_526);
  const items: TieredRetentionScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredRetentionScore(`tiered-retention-score-${index}`, "sample"));
  }
  const report = buildTieredRetentionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
