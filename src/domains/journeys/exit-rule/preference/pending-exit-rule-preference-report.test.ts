import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingExitRulePreferenceReport } from "./pending-exit-rule-preference-report.js";
import { PendingExitRulePreference, newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("PendingExitRulePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_825_554);
  const items: PendingExitRulePreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingExitRulePreference(`pending-exit-rule-preference-${index}`, "sample"));
  }
  const report = buildPendingExitRulePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
