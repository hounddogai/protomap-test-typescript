import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInVarianceReport } from "./double-opt-in-variance-report.js";
import { DoubleOptInVariance, newDoubleOptInVariance } from "./double-opt-in-variance.js";

test("DoubleOptInVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_120_155);
  const items: DoubleOptInVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDoubleOptInVariance(`double-opt-in-variance-${index}`, "sample"));
  }
  const report = buildDoubleOptInVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
