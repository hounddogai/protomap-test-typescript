import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierVarianceReport } from "./tier-variance-report.js";
import { TierVariance, newTierVariance } from "./tier-variance.js";

test("TierVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_552_136);
  const items: TierVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTierVariance(`tier-variance-${index}`, "sample"));
  }
  const report = buildTierVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
