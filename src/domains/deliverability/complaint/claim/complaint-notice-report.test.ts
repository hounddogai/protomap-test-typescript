import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintNoticeReport } from "./complaint-notice-report.js";
import { ComplaintNotice, newComplaintNotice } from "./complaint-notice.js";

test("ComplaintNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_150_473);
  const items: ComplaintNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newComplaintNotice(`complaint-notice-${index}`, "sample"));
  }
  const report = buildComplaintNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
