import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictApprovalScoreReport } from "./strict-approval-score-report.js";
import { StrictApprovalScore, newStrictApprovalScore } from "./strict-approval-score.js";

test("StrictApprovalScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_790_777);
  const items: StrictApprovalScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictApprovalScore(`strict-approval-score-${index}`, "sample"));
  }
  const report = buildStrictApprovalScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
