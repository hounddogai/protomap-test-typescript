import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalChallengeCycleEngine } from "./global-challenge-cycle-engine.js";
import { newGlobalChallengeCycle } from "./global-challenge-cycle.js";

test("GlobalChallengeCycleEngine keeps results within bounds", () => {
  const engine = defaultGlobalChallengeCycleEngine();
  const item = newGlobalChallengeCycle("code-89", "title-392");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
