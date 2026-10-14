import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictExitRuleCycleEngine } from "./strict-exit-rule-cycle-engine.js";
import { newStrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

test("StrictExitRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultStrictExitRuleCycleEngine(flags.newRegistry());
  const item = newStrictExitRuleCycle("code-957", "name-716");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
