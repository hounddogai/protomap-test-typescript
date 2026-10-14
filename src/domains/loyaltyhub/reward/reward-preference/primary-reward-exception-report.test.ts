import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryRewardExceptionReport } from "./primary-reward-exception-report.js";
import { PrimaryRewardException, newPrimaryRewardException } from "./primary-reward-exception.js";

test("PrimaryRewardExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_086_013);
  const items: PrimaryRewardException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryRewardException(`primary-reward-exception-${index}`, "sample"));
  }
  const report = buildPrimaryRewardExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
