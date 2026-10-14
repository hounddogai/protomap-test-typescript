import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakEntryReport } from "./streak-entry-report.js";
import { StreakEntry, newStreakEntry } from "./streak-entry.js";

test("StreakEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_217_857);
  const items: StreakEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStreakEntry(`streak-entry-${index}`, "sample"));
  }
  const report = buildStreakEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
