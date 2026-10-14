import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionRollupReport } from "./redemption-rollup-report.js";
import { RedemptionRollup, newRedemptionRollup } from "./redemption-rollup.js";

test("RedemptionRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_344_699);
  const items: RedemptionRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRedemptionRollup(`redemption-rollup-${index}`, "sample"));
  }
  const report = buildRedemptionRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
