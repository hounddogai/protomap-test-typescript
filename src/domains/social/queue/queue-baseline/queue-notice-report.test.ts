import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueNoticeReport } from "./queue-notice-report.js";
import { QueueNotice, newQueueNotice } from "./queue-notice.js";

test("QueueNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_519_208);
  const items: QueueNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueNotice(`queue-notice-${index}`, "sample"));
  }
  const report = buildQueueNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
