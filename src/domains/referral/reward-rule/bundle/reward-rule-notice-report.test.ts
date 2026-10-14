import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleNoticeReport } from "./reward-rule-notice-report.js";
import { RewardRuleNotice, newRewardRuleNotice } from "./reward-rule-notice.js";

test("RewardRuleNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_582_531);
  const items: RewardRuleNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRewardRuleNotice(`reward-rule-notice-${index}`, "sample"));
  }
  const report = buildRewardRuleNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
