import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedChallengeClaimReport } from "./capped-challenge-claim-report.js";
import { CappedChallengeClaim, newCappedChallengeClaim } from "./capped-challenge-claim.js";

test("CappedChallengeClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_975_345);
  const items: CappedChallengeClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedChallengeClaim(`capped-challenge-claim-${index}`, "sample"));
  }
  const report = buildCappedChallengeClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
