import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPostProfileReport } from "./batched-post-profile-report.js";
import { BatchedPostProfile, newBatchedPostProfile } from "./batched-post-profile.js";

test("BatchedPostProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_810_438);
  const items: BatchedPostProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedPostProfile(`batched-post-profile-${index}`, "sample"));
  }
  const report = buildBatchedPostProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
