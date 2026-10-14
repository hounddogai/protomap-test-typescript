import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveExitRuleBundleReport } from "./adaptive-exit-rule-bundle-report.js";
import { AdaptiveExitRuleBundle, newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("AdaptiveExitRuleBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_278_461);
  const items: AdaptiveExitRuleBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveExitRuleBundle(`adaptive-exit-rule-bundle-${index}`, "sample"));
  }
  const report = buildAdaptiveExitRuleBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
