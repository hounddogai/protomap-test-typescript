import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackChallengeOverrideReport } from "./fallback-challenge-override-report.js";
import { FallbackChallengeOverride, newFallbackChallengeOverride } from "./fallback-challenge-override.js";

test("FallbackChallengeOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_486_892);
  const items: FallbackChallengeOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackChallengeOverride(`fallback-challenge-override-${index}`, "sample"));
  }
  const report = buildFallbackChallengeOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
