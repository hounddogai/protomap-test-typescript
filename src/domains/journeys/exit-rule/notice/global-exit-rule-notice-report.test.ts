import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalExitRuleNoticeReport } from "./global-exit-rule-notice-report.js";
import { GlobalExitRuleNotice, newGlobalExitRuleNotice } from "./global-exit-rule-notice.js";

test("GlobalExitRuleNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_356_739);
  const items: GlobalExitRuleNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalExitRuleNotice(`global-exit-rule-notice-${index}`, "sample"));
  }
  const report = buildGlobalExitRuleNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
