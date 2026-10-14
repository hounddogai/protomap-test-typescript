import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCreditSlotReport } from "./fallback-credit-slot-report.js";
import { FallbackCreditSlot, newFallbackCreditSlot } from "./fallback-credit-slot.js";

test("FallbackCreditSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_498_145);
  const items: FallbackCreditSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackCreditSlot(`fallback-credit-slot-${index}`, "sample"));
  }
  const report = buildFallbackCreditSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
