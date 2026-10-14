import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackExitRuleCycleEngine } from "./fallback-exit-rule-cycle-engine.js";
import { newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("FallbackExitRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultFallbackExitRuleCycleEngine(flags.newRegistry());
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
