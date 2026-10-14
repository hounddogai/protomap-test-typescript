import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardEntryReport } from "./reward-entry-report.js";
import { RewardEntry, newRewardEntry } from "./reward-entry.js";

test("RewardEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_381_043);
  const items: RewardEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRewardEntry(`reward-entry-${index}`, "sample"));
  }
  const report = buildRewardEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
