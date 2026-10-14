import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeScoreReport } from "./creative-score-report.js";
import { CreativeScore, newCreativeScore } from "./creative-score.js";

test("CreativeScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_816_038);
  const items: CreativeScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCreativeScore(`creative-score-${index}`, "sample"));
  }
  const report = buildCreativeScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
