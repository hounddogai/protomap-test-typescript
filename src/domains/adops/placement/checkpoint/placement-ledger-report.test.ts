import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementLedgerReport } from "./placement-ledger-report.js";
import { PlacementLedger, newPlacementLedger } from "./placement-ledger.js";

test("PlacementLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_328_426);
  const items: PlacementLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPlacementLedger(`placement-ledger-${index}`, "sample"));
  }
  const report = buildPlacementLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
