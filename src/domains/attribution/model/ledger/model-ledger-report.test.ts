import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelLedgerReport } from "./model-ledger-report.js";
import { ModelLedger, newModelLedger } from "./model-ledger.js";

test("ModelLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_596_288);
  const items: ModelLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newModelLedger(`model-ledger-${index}`, "sample"));
  }
  const report = buildModelLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
