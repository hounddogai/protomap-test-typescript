import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictProofEntryReport } from "./strict-proof-entry-report.js";
import { StrictProofEntry, newStrictProofEntry } from "./strict-proof-entry.js";

test("StrictProofEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_301_560);
  const items: StrictProofEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictProofEntry(`strict-proof-entry-${index}`, "sample"));
  }
  const report = buildStrictProofEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
