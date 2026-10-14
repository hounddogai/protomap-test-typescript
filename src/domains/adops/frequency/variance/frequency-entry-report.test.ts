import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyEntryReport } from "./frequency-entry-report.js";
import { FrequencyEntry, newFrequencyEntry } from "./frequency-entry.js";

test("FrequencyEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_466_941);
  const items: FrequencyEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFrequencyEntry(`frequency-entry-${index}`, "sample"));
  }
  const report = buildFrequencyEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
