import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionSlotReport } from "./suppression-slot-report.js";
import { SuppressionSlot, newSuppressionSlot } from "./suppression-slot.js";

test("SuppressionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_620_168);
  const items: SuppressionSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSuppressionSlot(`suppression-slot-${index}`, "sample"));
  }
  const report = buildSuppressionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
