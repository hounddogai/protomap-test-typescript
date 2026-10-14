import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedStepEntryReport } from "./capped-step-entry-report.js";
import { CappedStepEntry, newCappedStepEntry } from "./capped-step-entry.js";

test("CappedStepEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_492_019);
  const items: CappedStepEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedStepEntry(`capped-step-entry-${index}`, "sample"));
  }
  const report = buildCappedStepEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
