import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderNoticeReport } from "./sender-notice-report.js";
import { SenderNotice, newSenderNotice } from "./sender-notice.js";

test("SenderNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_288_988);
  const items: SenderNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSenderNotice(`sender-notice-${index}`, "sample"));
  }
  const report = buildSenderNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
