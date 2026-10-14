import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalInsightScoreReport } from "./regional-insight-score-report.js";
import { RegionalInsightScore, newRegionalInsightScore } from "./regional-insight-score.js";

test("RegionalInsightScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_950_411);
  const items: RegionalInsightScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalInsightScore(`regional-insight-score-${index}`, "sample"));
  }
  const report = buildRegionalInsightScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
