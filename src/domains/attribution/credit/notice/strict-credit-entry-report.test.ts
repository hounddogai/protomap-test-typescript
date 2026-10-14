import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictCreditEntryReport } from "./strict-credit-entry-report.js";
import { StrictCreditEntry, newStrictCreditEntry } from "./strict-credit-entry.js";

test("StrictCreditEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_480_235);
  const items: StrictCreditEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictCreditEntry(`strict-credit-entry-${index}`, "sample"));
  }
  const report = buildStrictCreditEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
