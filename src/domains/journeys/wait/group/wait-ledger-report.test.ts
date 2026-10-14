import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitLedgerReport } from "./wait-ledger-report.js";
import { WaitLedger, newWaitLedger } from "./wait-ledger.js";

test("WaitLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_812_399);
  const items: WaitLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWaitLedger(`wait-ledger-${index}`, "sample"));
  }
  const report = buildWaitLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
