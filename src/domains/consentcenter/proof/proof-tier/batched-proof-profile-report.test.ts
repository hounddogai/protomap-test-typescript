import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedProofProfileReport } from "./batched-proof-profile-report.js";
import { BatchedProofProfile, newBatchedProofProfile } from "./batched-proof-profile.js";

test("BatchedProofProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_820_124);
  const items: BatchedProofProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedProofProfile(`batched-proof-profile-${index}`, "sample"));
  }
  const report = buildBatchedProofProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
