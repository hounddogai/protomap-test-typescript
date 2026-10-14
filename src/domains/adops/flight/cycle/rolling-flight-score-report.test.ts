import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingFlightScoreReport } from "./rolling-flight-score-report.js";
import { RollingFlightScore, newRollingFlightScore } from "./rolling-flight-score.js";

test("RollingFlightScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_972_405);
  const items: RollingFlightScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingFlightScore(`rolling-flight-score-${index}`, "sample"));
  }
  const report = buildRollingFlightScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
