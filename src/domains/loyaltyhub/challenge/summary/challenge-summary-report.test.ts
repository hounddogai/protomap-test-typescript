import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeSummaryReport } from "./challenge-summary-report.js";
import { ChallengeSummary, newChallengeSummary } from "./challenge-summary.js";

test("ChallengeSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_971_186);
  const items: ChallengeSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newChallengeSummary(`challenge-summary-${index}`, "sample"));
  }
  const report = buildChallengeSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
