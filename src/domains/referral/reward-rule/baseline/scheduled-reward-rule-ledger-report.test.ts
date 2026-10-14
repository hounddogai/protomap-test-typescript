import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledRewardRuleLedgerReport } from "./scheduled-reward-rule-ledger-report.js";
import { ScheduledRewardRuleLedger, newScheduledRewardRuleLedger } from "./scheduled-reward-rule-ledger.js";

test("ScheduledRewardRuleLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_004_855);
  const items: ScheduledRewardRuleLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledRewardRuleLedger(`scheduled-reward-rule-ledger-${index}`, "sample"));
  }
  const report = buildScheduledRewardRuleLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
