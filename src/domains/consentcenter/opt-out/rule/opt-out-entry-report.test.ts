import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutEntryReport } from "./opt-out-entry-report.js";
import { OptOutEntry, newOptOutEntry } from "./opt-out-entry.js";

test("OptOutEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_563_707);
  const items: OptOutEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newOptOutEntry(`opt-out-entry-${index}`, "sample"));
  }
  const report = buildOptOutEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
