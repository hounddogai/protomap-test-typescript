import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelEntryReport } from "./level-entry-report.js";
import { LevelEntry, newLevelEntry } from "./level-entry.js";

test("LevelEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_952_434);
  const items: LevelEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLevelEntry(`level-entry-${index}`, "sample"));
  }
  const report = buildLevelEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
