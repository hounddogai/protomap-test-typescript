import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeRecordReport } from "./challenge-record-report.js";
import { ChallengeRecord, newChallengeRecord } from "./challenge-record.js";

test("ChallengeRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_563_201);
  const items: ChallengeRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newChallengeRecord(`challenge-record-${index}`, "sample"));
  }
  const report = buildChallengeRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
