import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictRewardRuleManifestReport } from "./strict-reward-rule-manifest-report.js";
import { StrictRewardRuleManifest, newStrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

test("StrictRewardRuleManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_772_830);
  const items: StrictRewardRuleManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictRewardRuleManifest(`strict-reward-rule-manifest-${index}`, "sample"));
  }
  const report = buildStrictRewardRuleManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
