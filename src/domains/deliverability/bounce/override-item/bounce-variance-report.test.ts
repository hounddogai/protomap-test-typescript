import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceVarianceReport } from "./bounce-variance-report.js";
import { BounceVariance, newBounceVariance } from "./bounce-variance.js";

test("BounceVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_978_276);
  const items: BounceVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBounceVariance(`bounce-variance-${index}`, "sample"));
  }
  const report = buildBounceVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
