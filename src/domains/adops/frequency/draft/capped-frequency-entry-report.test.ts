import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFrequencyEntryReport } from "./capped-frequency-entry-report.js";
import { CappedFrequencyEntry, newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("CappedFrequencyEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_879_491);
  const items: CappedFrequencyEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedFrequencyEntry(`capped-frequency-entry-${index}`, "sample"));
  }
  const report = buildCappedFrequencyEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
