import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryWarmupVarianceReport } from "./primary-warmup-variance-report.js";
import { PrimaryWarmupVariance, newPrimaryWarmupVariance } from "./primary-warmup-variance.js";

test("PrimaryWarmupVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_074_237);
  const items: PrimaryWarmupVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryWarmupVariance(`primary-warmup-variance-${index}`, "sample"));
  }
  const report = buildPrimaryWarmupVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
