import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelScoreReport } from "./funnel-score-report.js";
import { FunnelScore, newFunnelScore } from "./funnel-score.js";

test("FunnelScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_102_701);
  const items: FunnelScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFunnelScore(`funnel-score-${index}`, "sample"));
  }
  const report = buildFunnelScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
