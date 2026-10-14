import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleBundleReport } from "./exit-rule-bundle-report.js";
import { ExitRuleBundle, newExitRuleBundle } from "./exit-rule-bundle.js";

test("ExitRuleBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_117_230);
  const items: ExitRuleBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newExitRuleBundle(`exit-rule-bundle-${index}`, "sample"));
  }
  const report = buildExitRuleBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
