import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultWarmupEstimateReport } from "./default-warmup-estimate-report.js";
import { DefaultWarmupEstimate, newDefaultWarmupEstimate } from "./default-warmup-estimate.js";

test("DefaultWarmupEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_301_754);
  const items: DefaultWarmupEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultWarmupEstimate(`default-warmup-estimate-${index}`, "sample"));
  }
  const report = buildDefaultWarmupEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
