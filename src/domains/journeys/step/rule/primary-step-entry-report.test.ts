import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryStepEntryReport } from "./primary-step-entry-report.js";
import { PrimaryStepEntry, newPrimaryStepEntry } from "./primary-step-entry.js";

test("PrimaryStepEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_555_839);
  const items: PrimaryStepEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryStepEntry(`primary-step-entry-${index}`, "sample"));
  }
  const report = buildPrimaryStepEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
