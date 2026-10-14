import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSenderEntryReport } from "./scheduled-sender-entry-report.js";
import { ScheduledSenderEntry, newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("ScheduledSenderEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_407_073);
  const items: ScheduledSenderEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledSenderEntry(`scheduled-sender-entry-${index}`, "sample"));
  }
  const report = buildScheduledSenderEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
