import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalExitRuleNoticeReport } from "./regional-exit-rule-notice-report.js";
import { RegionalExitRuleNotice, newRegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

test("RegionalExitRuleNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_565_265);
  const items: RegionalExitRuleNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalExitRuleNotice(`regional-exit-rule-notice-${index}`, "sample"));
  }
  const report = buildRegionalExitRuleNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
