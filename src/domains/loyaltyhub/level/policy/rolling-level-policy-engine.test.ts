import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingLevelPolicyEngine } from "./rolling-level-policy-engine.js";
import { newRollingLevelPolicy } from "./rolling-level-policy.js";

test("RollingLevelPolicyEngine keeps results within bounds", () => {
  const engine = defaultRollingLevelPolicyEngine(flags.newRegistry());
  const item = newRollingLevelPolicy("code-879", "name-292");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
