import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredChallengeSummaryReport } from "./tiered-challenge-summary-report.js";
import { TieredChallengeSummary, newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("TieredChallengeSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_466_756);
  const items: TieredChallengeSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredChallengeSummary(`tiered-challenge-summary-${index}`, "sample"));
  }
  const report = buildTieredChallengeSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
