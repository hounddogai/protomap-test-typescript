import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowScoreReport } from "./window-score-report.js";
import { WindowScore, newWindowScore } from "./window-score.js";

test("WindowScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_171_950);
  const items: WindowScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWindowScore(`window-score-${index}`, "sample"));
  }
  const report = buildWindowScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
