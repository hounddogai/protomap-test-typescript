import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationSlotReport } from "./activation-slot-report.js";
import { ActivationSlot, newActivationSlot } from "./activation-slot.js";

test("ActivationSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_655_607);
  const items: ActivationSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newActivationSlot(`activation-slot-${index}`, "sample"));
  }
  const report = buildActivationSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
