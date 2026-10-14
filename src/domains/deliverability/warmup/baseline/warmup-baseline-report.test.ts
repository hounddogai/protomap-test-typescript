import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupBaselineReport } from "./warmup-baseline-report.js";
import { WarmupBaseline, newWarmupBaseline } from "./warmup-baseline.js";

test("WarmupBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_251_409);
  const items: WarmupBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWarmupBaseline(`warmup-baseline-${index}`, "sample"));
  }
  const report = buildWarmupBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
