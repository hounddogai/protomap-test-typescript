import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingExitRuleLedgerReport } from "./rolling-exit-rule-ledger-report.js";
import { RollingExitRuleLedger, newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

test("RollingExitRuleLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_362_728);
  const items: RollingExitRuleLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingExitRuleLedger(`rolling-exit-rule-ledger-${index}`, "sample"));
  }
  const report = buildRollingExitRuleLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
