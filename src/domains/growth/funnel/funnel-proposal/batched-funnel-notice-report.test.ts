import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedFunnelNoticeReport } from "./batched-funnel-notice-report.js";
import { BatchedFunnelNotice, newBatchedFunnelNotice } from "./batched-funnel-notice.js";

test("BatchedFunnelNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_009_326);
  const items: BatchedFunnelNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedFunnelNotice(`batched-funnel-notice-${index}`, "sample"));
  }
  const report = buildBatchedFunnelNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
