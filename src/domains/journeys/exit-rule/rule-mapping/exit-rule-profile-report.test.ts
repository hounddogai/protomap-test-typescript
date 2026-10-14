import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleProfileReport } from "./exit-rule-profile-report.js";
import { ExitRuleProfile, newExitRuleProfile } from "./exit-rule-profile.js";

test("ExitRuleProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_611_829);
  const items: ExitRuleProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newExitRuleProfile(`exit-rule-profile-${index}`, "sample"));
  }
  const report = buildExitRuleProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
