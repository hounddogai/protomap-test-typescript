import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleBatchReport } from "./exit-rule-batch-report.js";
import { ExitRuleBatch, newExitRuleBatch } from "./exit-rule-batch.js";

test("ExitRuleBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_034_114);
  const items: ExitRuleBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newExitRuleBatch(`exit-rule-batch-${index}`, "sample"));
  }
  const report = buildExitRuleBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
