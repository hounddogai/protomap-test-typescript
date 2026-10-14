import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveExitRuleSnapshotReport } from "./adaptive-exit-rule-snapshot-report.js";
import { AdaptiveExitRuleSnapshot, newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

test("AdaptiveExitRuleSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_182_759);
  const items: AdaptiveExitRuleSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveExitRuleSnapshot(`adaptive-exit-rule-snapshot-${index}`, "sample"));
  }
  const report = buildAdaptiveExitRuleSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
