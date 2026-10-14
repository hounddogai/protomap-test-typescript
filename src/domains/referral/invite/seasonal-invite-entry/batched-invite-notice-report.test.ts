import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedInviteNoticeReport } from "./batched-invite-notice-report.js";
import { BatchedInviteNotice, newBatchedInviteNotice } from "./batched-invite-notice.js";

test("BatchedInviteNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_156_926);
  const items: BatchedInviteNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedInviteNotice(`batched-invite-notice-${index}`, "sample"));
  }
  const report = buildBatchedInviteNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
