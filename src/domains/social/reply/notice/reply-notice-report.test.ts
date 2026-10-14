import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyNoticeReport } from "./reply-notice-report.js";
import { ReplyNotice, newReplyNotice } from "./reply-notice.js";

test("ReplyNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_518_766);
  const items: ReplyNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReplyNotice(`reply-notice-${index}`, "sample"));
  }
  const report = buildReplyNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
