import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalSlotReport } from "./approval-slot-report.js";
import { ApprovalSlot, newApprovalSlot } from "./approval-slot.js";

test("ApprovalSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_383_786);
  const items: ApprovalSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newApprovalSlot(`approval-slot-${index}`, "sample"));
  }
  const report = buildApprovalSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
