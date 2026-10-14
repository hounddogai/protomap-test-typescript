import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredChallengeOverrideReport } from "./tiered-challenge-override-report.js";
import { TieredChallengeOverride, newTieredChallengeOverride } from "./tiered-challenge-override.js";

test("TieredChallengeOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_213_866);
  const items: TieredChallengeOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredChallengeOverride(`tiered-challenge-override-${index}`, "sample"));
  }
  const report = buildTieredChallengeOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
