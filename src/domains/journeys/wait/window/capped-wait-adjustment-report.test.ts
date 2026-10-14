import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedWaitAdjustmentReport } from "./capped-wait-adjustment-report.js";
import { CappedWaitAdjustment, newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("CappedWaitAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_192_804);
  const items: CappedWaitAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedWaitAdjustment(`capped-wait-adjustment-${index}`, "sample"));
  }
  const report = buildCappedWaitAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
