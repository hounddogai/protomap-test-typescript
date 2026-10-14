import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryOptOutLedgerReport } from "./primary-opt-out-ledger-report.js";
import { PrimaryOptOutLedger, newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("PrimaryOptOutLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_622_856);
  const items: PrimaryOptOutLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryOptOutLedger(`primary-opt-out-ledger-${index}`, "sample"));
  }
  const report = buildPrimaryOptOutLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
