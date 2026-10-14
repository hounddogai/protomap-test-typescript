import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationVarianceReport } from "./activation-variance-report.js";
import { ActivationVariance, newActivationVariance } from "./activation-variance.js";

test("ActivationVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_158_012);
  const items: ActivationVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newActivationVariance(`activation-variance-${index}`, "sample"));
  }
  const report = buildActivationVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
