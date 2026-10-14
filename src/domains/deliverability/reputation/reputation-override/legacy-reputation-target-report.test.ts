import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyReputationTargetReport } from "./legacy-reputation-target-report.js";
import { LegacyReputationTarget, newLegacyReputationTarget } from "./legacy-reputation-target.js";

test("LegacyReputationTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_090_380);
  const items: LegacyReputationTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyReputationTarget(`legacy-reputation-target-${index}`, "sample"));
  }
  const report = buildLegacyReputationTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
