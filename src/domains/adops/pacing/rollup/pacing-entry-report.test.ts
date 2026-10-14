import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingEntryReport } from "./pacing-entry-report.js";
import { PacingEntry, newPacingEntry } from "./pacing-entry.js";

test("PacingEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_599_130);
  const items: PacingEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPacingEntry(`pacing-entry-${index}`, "sample"));
  }
  const report = buildPacingEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
