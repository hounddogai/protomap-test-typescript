import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionSlotReport } from "./retention-slot-report.js";
import { RetentionSlot, newRetentionSlot } from "./retention-slot.js";

test("RetentionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_559_816);
  const items: RetentionSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRetentionSlot(`retention-slot-${index}`, "sample"));
  }
  const report = buildRetentionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
