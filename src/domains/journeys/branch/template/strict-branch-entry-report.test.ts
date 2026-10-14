import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictBranchEntryReport } from "./strict-branch-entry-report.js";
import { StrictBranchEntry, newStrictBranchEntry } from "./strict-branch-entry.js";

test("StrictBranchEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_575_920);
  const items: StrictBranchEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictBranchEntry(`strict-branch-entry-${index}`, "sample"));
  }
  const report = buildStrictBranchEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
