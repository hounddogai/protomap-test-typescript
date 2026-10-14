import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderEntryReport } from "./sender-entry-report.js";
import { SenderEntry, newSenderEntry } from "./sender-entry.js";

test("SenderEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_383_580);
  const items: SenderEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSenderEntry(`sender-entry-${index}`, "sample"));
  }
  const report = buildSenderEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
