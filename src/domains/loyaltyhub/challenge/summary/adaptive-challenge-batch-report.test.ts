import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveChallengeBatchReport } from "./adaptive-challenge-batch-report.js";
import { AdaptiveChallengeBatch, newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("AdaptiveChallengeBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_549_486);
  const items: AdaptiveChallengeBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveChallengeBatch(`adaptive-challenge-batch-${index}`, "sample"));
  }
  const report = buildAdaptiveChallengeBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
