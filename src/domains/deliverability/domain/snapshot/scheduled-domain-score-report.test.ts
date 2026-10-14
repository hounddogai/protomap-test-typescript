import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDomainScoreReport } from "./scheduled-domain-score-report.js";
import { ScheduledDomainScore, newScheduledDomainScore } from "./scheduled-domain-score.js";

test("ScheduledDomainScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_849_713);
  const items: ScheduledDomainScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledDomainScore(`scheduled-domain-score-${index}`, "sample"));
  }
  const report = buildScheduledDomainScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
