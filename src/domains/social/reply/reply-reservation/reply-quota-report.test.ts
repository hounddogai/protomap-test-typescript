import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyQuotaReport } from "./reply-quota-report.js";
import { ReplyQuota, newReplyQuota } from "./reply-quota.js";

test("ReplyQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_874_959);
  const items: ReplyQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReplyQuota(`reply-quota-${index}`, "sample"));
  }
  const report = buildReplyQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
