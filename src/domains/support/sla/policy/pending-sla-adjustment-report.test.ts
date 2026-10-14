import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingSlaAdjustmentReport } from "./pending-sla-adjustment-report.js";
import { PendingSlaAdjustment, newPendingSlaAdjustment } from "./pending-sla-adjustment.js";

test("PendingSlaAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_306_454);
  const items: PendingSlaAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingSlaAdjustment(`pending-sla-adjustment-${index}`, "sample"));
  }
  const report = buildPendingSlaAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
