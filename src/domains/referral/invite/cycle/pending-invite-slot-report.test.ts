import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingInviteSlotReport } from "./pending-invite-slot-report.js";
import { PendingInviteSlot, newPendingInviteSlot } from "./pending-invite-slot.js";

test("PendingInviteSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_375_083);
  const items: PendingInviteSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingInviteSlot(`pending-invite-slot-${index}`, "sample"));
  }
  const report = buildPendingInviteSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
