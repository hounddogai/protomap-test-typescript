import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultBadgeSlotReport } from "./default-badge-slot-report.js";
import { DefaultBadgeSlot, newDefaultBadgeSlot } from "./default-badge-slot.js";

test("DefaultBadgeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_134_059);
  const items: DefaultBadgeSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultBadgeSlot(`default-badge-slot-${index}`, "sample"));
  }
  const report = buildDefaultBadgeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
