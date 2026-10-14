import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedInviteEntryReport } from "./batched-invite-entry-report.js";
import { BatchedInviteEntry, newBatchedInviteEntry } from "./batched-invite-entry.js";

test("BatchedInviteEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_679_515);
  const items: BatchedInviteEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedInviteEntry(`batched-invite-entry-${index}`, "sample"));
  }
  const report = buildBatchedInviteEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
