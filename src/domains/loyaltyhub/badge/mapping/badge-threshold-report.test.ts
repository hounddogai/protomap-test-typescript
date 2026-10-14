import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeThresholdReport } from "./badge-threshold-report.js";
import { BadgeThreshold, newBadgeThreshold } from "./badge-threshold.js";

test("BadgeThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_852_672);
  const items: BadgeThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBadgeThreshold(`badge-threshold-${index}`, "sample"));
  }
  const report = buildBadgeThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
