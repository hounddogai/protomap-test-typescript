import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryRewardRuleManifestReport } from "./primary-reward-rule-manifest-report.js";
import { PrimaryRewardRuleManifest, newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("PrimaryRewardRuleManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_977_912);
  const items: PrimaryRewardRuleManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryRewardRuleManifest(`primary-reward-rule-manifest-${index}`, "sample"));
  }
  const report = buildPrimaryRewardRuleManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
