import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionNoticeReport } from "./subscription-notice-report.js";
import { SubscriptionNotice, newSubscriptionNotice } from "./subscription-notice.js";

test("SubscriptionNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_245_926);
  const items: SubscriptionNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSubscriptionNotice(`subscription-notice-${index}`, "sample"));
  }
  const report = buildSubscriptionNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
