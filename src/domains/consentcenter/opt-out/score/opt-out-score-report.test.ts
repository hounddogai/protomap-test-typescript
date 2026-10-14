import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutScoreReport } from "./opt-out-score-report.js";
import { OptOutScore, newOptOutScore } from "./opt-out-score.js";

test("OptOutScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_919_007);
  const items: OptOutScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newOptOutScore(`opt-out-score-${index}`, "sample"));
  }
  const report = buildOptOutScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
