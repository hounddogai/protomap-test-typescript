import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyChallengeTargetReport } from "./legacy-challenge-target-report.js";
import { LegacyChallengeTarget, newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("LegacyChallengeTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_371_832);
  const items: LegacyChallengeTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyChallengeTarget(`legacy-challenge-target-${index}`, "sample"));
  }
  const report = buildLegacyChallengeTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
