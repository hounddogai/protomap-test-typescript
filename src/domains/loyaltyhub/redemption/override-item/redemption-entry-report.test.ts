import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionEntryReport } from "./redemption-entry-report.js";
import { RedemptionEntry, newRedemptionEntry } from "./redemption-entry.js";

test("RedemptionEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_875_369);
  const items: RedemptionEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRedemptionEntry(`redemption-entry-${index}`, "sample"));
  }
  const report = buildRedemptionEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
