import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRewardBundleReport } from "./tiered-reward-bundle-report.js";
import { TieredRewardBundle, newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("TieredRewardBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_221_680);
  const items: TieredRewardBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredRewardBundle(`tiered-reward-bundle-${index}`, "sample"));
  }
  const report = buildTieredRewardBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
