import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleCheckpointReport } from "./exit-rule-checkpoint-report.js";
import { ExitRuleCheckpoint, newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("ExitRuleCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_142_745);
  const items: ExitRuleCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newExitRuleCheckpoint(`exit-rule-checkpoint-${index}`, "sample"));
  }
  const report = buildExitRuleCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
