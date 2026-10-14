import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedReplyClaimReport } from "./batched-reply-claim-report.js";
import { BatchedReplyClaim, newBatchedReplyClaim } from "./batched-reply-claim.js";

test("BatchedReplyClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_370_485);
  const items: BatchedReplyClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedReplyClaim(`batched-reply-claim-${index}`, "sample"));
  }
  const report = buildBatchedReplyClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
