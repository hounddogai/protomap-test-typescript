import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalExitRuleManifestReport } from "./seasonal-exit-rule-manifest-report.js";
import { SeasonalExitRuleManifest, newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("SeasonalExitRuleManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_500_620);
  const items: SeasonalExitRuleManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalExitRuleManifest(`seasonal-exit-rule-manifest-${index}`, "sample"));
  }
  const report = buildSeasonalExitRuleManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
