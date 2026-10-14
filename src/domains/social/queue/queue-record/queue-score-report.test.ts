import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueScoreReport } from "./queue-score-report.js";
import { QueueScore, newQueueScore } from "./queue-score.js";

test("QueueScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_578_248);
  const items: QueueScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newQueueScore(`queue-score-${index}`, "sample"));
  }
  const report = buildQueueScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
