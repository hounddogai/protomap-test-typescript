import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackInviteBaselineEngine } from "./fallback-invite-baseline-engine.js";
import { newFallbackInviteBaseline } from "./fallback-invite-baseline.js";

test("FallbackInviteBaselineEngine keeps results within bounds", () => {
  const engine = defaultFallbackInviteBaselineEngine(flags.newRegistry());
  const item = newFallbackInviteBaseline("code-82", "name-67");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
