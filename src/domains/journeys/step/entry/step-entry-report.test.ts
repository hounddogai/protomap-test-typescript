import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepEntryReport } from "./step-entry-report.js";
import { StepEntry, newStepEntry } from "./step-entry.js";

test("StepEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_220_915);
  const items: StepEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStepEntry(`step-entry-${index}`, "sample"));
  }
  const report = buildStepEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
