import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteBaselineEngine } from "./invite-baseline-engine.js";
import { newInviteBaseline } from "./invite-baseline.js";

test("InviteBaselineEngine keeps results within bounds", () => {
  const engine = defaultInviteBaselineEngine();
  const item = newInviteBaseline("code-218", "label-576");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
