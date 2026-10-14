import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalCreativeScoreReport } from "./regional-creative-score-report.js";
import { RegionalCreativeScore, newRegionalCreativeScore } from "./regional-creative-score.js";

test("RegionalCreativeScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_070_954);
  const items: RegionalCreativeScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalCreativeScore(`regional-creative-score-${index}`, "sample"));
  }
  const report = buildRegionalCreativeScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
