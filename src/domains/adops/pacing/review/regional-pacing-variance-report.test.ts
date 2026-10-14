import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalPacingVarianceReport } from "./regional-pacing-variance-report.js";
import { RegionalPacingVariance, newRegionalPacingVariance } from "./regional-pacing-variance.js";

test("RegionalPacingVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_865_049);
  const items: RegionalPacingVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalPacingVariance(`regional-pacing-variance-${index}`, "sample"));
  }
  const report = buildRegionalPacingVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
