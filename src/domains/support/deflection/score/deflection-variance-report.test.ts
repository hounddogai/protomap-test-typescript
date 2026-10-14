import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionVarianceReport } from "./deflection-variance-report.js";
import { DeflectionVariance, newDeflectionVariance } from "./deflection-variance.js";

test("DeflectionVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_133_528);
  const items: DeflectionVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDeflectionVariance(`deflection-variance-${index}`, "sample"));
  }
  const report = buildDeflectionVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
