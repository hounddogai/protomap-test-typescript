import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPacingVarianceReport } from "./default-pacing-variance-report.js";
import { DefaultPacingVariance, newDefaultPacingVariance } from "./default-pacing-variance.js";

test("DefaultPacingVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_376_797);
  const items: DefaultPacingVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultPacingVariance(`default-pacing-variance-${index}`, "sample"));
  }
  const report = buildDefaultPacingVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
