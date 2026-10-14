import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSenderScoreReport } from "./regional-sender-score-report.js";
import { RegionalSenderScore, newRegionalSenderScore } from "./regional-sender-score.js";

test("RegionalSenderScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_575_431);
  const items: RegionalSenderScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalSenderScore(`regional-sender-score-${index}`, "sample"));
  }
  const report = buildRegionalSenderScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
