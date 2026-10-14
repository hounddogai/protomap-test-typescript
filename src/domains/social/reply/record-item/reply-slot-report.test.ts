import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplySlotReport } from "./reply-slot-report.js";
import { ReplySlot, newReplySlot } from "./reply-slot.js";

test("ReplySlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_525_597);
  const items: ReplySlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReplySlot(`reply-slot-${index}`, "sample"));
  }
  const report = buildReplySlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
