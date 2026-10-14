import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictApprovalScoreEngine } from "./strict-approval-score-engine.js";
import { newStrictApprovalScore } from "./strict-approval-score.js";

test("StrictApprovalScoreEngine keeps results within bounds", () => {
  const engine = defaultStrictApprovalScoreEngine(flags.newRegistry());
  const item = newStrictApprovalScore("code-656", "label-295");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
