import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedBidRuleQuotaReport } from "./capped-bid-rule-quota-report.js";
import { CappedBidRuleQuota, newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

test("CappedBidRuleQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_819_675);
  const items: CappedBidRuleQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedBidRuleQuota(`capped-bid-rule-quota-${index}`, "sample"));
  }
  const report = buildCappedBidRuleQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
