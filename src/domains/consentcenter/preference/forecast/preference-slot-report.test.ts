import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceSlotReport } from "./preference-slot-report.js";
import { PreferenceSlot, newPreferenceSlot } from "./preference-slot.js";

test("PreferenceSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_218_732);
  const items: PreferenceSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPreferenceSlot(`preference-slot-${index}`, "sample"));
  }
  const report = buildPreferenceSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
