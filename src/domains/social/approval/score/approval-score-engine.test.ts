import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalScoreEngine } from "./approval-score-engine.js";
import { newApprovalScore } from "./approval-score.js";

test("ApprovalScoreEngine keeps results within bounds", () => {
  const engine = defaultApprovalScoreEngine(flags.newRegistry());
  const item = newApprovalScore("code-6", "title-914");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
