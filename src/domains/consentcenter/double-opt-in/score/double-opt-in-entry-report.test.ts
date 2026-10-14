import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInEntryReport } from "./double-opt-in-entry-report.js";
import { DoubleOptInEntry, newDoubleOptInEntry } from "./double-opt-in-entry.js";

test("DoubleOptInEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_175_437);
  const items: DoubleOptInEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInEntry(`double-opt-in-entry-${index}`, "sample"));
  }
  const report = buildDoubleOptInEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
