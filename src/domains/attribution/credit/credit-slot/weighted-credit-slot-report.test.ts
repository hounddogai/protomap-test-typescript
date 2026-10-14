import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedCreditSlotReport } from "./weighted-credit-slot-report.js";
import { WeightedCreditSlot, newWeightedCreditSlot } from "./weighted-credit-slot.js";

test("WeightedCreditSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_942_591);
  const items: WeightedCreditSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedCreditSlot(`weighted-credit-slot-${index}`, "sample"));
  }
  const report = buildWeightedCreditSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
