import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedQueueNoticeReport } from "./capped-queue-notice-report.js";
import { CappedQueueNotice, newCappedQueueNotice } from "./capped-queue-notice.js";

test("CappedQueueNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_826_918);
  const items: CappedQueueNotice[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedQueueNotice(`capped-queue-notice-${index}`, "sample"));
  }
  const report = buildCappedQueueNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
