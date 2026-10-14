import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledChallengeTierReport } from "./scheduled-challenge-tier-report.js";
import { ScheduledChallengeTier, newScheduledChallengeTier } from "./scheduled-challenge-tier.js";

test("ScheduledChallengeTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_332_344);
  const items: ScheduledChallengeTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledChallengeTier(`scheduled-challenge-tier-${index}`, "sample"));
  }
  const report = buildScheduledChallengeTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
