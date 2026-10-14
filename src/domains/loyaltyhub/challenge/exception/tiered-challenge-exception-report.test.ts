import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredChallengeExceptionReport } from "./tiered-challenge-exception-report.js";
import { TieredChallengeException, newTieredChallengeException } from "./tiered-challenge-exception.js";

test("TieredChallengeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_855_367);
  const items: TieredChallengeException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredChallengeException(`tiered-challenge-exception-${index}`, "sample"));
  }
  const report = buildTieredChallengeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
