import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationBaselineReport } from "./reputation-baseline-report.js";
import { ReputationBaseline, newReputationBaseline } from "./reputation-baseline.js";

test("ReputationBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_425_560);
  const items: ReputationBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReputationBaseline(`reputation-baseline-${index}`, "sample"));
  }
  const report = buildReputationBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
