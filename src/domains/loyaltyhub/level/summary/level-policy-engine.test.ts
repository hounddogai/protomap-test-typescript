import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelPolicyEngine } from "./level-policy-engine.js";
import { newLevelPolicy } from "./level-policy.js";

test("LevelPolicyEngine keeps results within bounds", () => {
  const engine = defaultLevelPolicyEngine(flags.newRegistry());
  const item = newLevelPolicy("code-52", "name-776");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
