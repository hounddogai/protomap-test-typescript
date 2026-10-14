import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeCycleEngine } from "./challenge-cycle-engine.js";
import { newChallengeCycle } from "./challenge-cycle.js";

test("ChallengeCycleEngine keeps results within bounds", () => {
  const engine = defaultChallengeCycleEngine();
  const item = newChallengeCycle("code-110", "name-433");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
