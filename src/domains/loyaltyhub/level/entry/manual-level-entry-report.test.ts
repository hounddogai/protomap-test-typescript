import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualLevelEntryReport } from "./manual-level-entry-report.js";
import { ManualLevelEntry, newManualLevelEntry } from "./manual-level-entry.js";

test("ManualLevelEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_627_869);
  const items: ManualLevelEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualLevelEntry(`manual-level-entry-${index}`, "sample"));
  }
  const report = buildManualLevelEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
