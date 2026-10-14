import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofEntryReport } from "./proof-entry-report.js";
import { ProofEntry, newProofEntry } from "./proof-entry.js";

test("ProofEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_125_141);
  const items: ProofEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newProofEntry(`proof-entry-${index}`, "sample"));
  }
  const report = buildProofEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
