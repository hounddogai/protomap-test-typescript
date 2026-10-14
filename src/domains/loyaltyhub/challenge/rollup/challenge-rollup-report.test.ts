import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeRollupReport } from "./challenge-rollup-report.js";
import { ChallengeRollup, newChallengeRollup } from "./challenge-rollup.js";

test("ChallengeRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_352_042);
  const items: ChallengeRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newChallengeRollup(`challenge-rollup-${index}`, "sample"));
  }
  const report = buildChallengeRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
