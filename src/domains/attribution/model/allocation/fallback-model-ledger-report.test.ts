import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackModelLedgerReport } from "./fallback-model-ledger-report.js";
import { FallbackModelLedger, newFallbackModelLedger } from "./fallback-model-ledger.js";

test("FallbackModelLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_111_526);
  const items: FallbackModelLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackModelLedger(`fallback-model-ledger-${index}`, "sample"));
  }
  const report = buildFallbackModelLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
