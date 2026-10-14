import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledPathEntryReport } from "./scheduled-path-entry-report.js";
import { ScheduledPathEntry, newScheduledPathEntry } from "./scheduled-path-entry.js";

test("ScheduledPathEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_991_845);
  const items: ScheduledPathEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledPathEntry(`scheduled-path-entry-${index}`, "sample"));
  }
  const report = buildScheduledPathEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
