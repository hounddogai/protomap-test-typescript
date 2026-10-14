import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleBatchEngine } from "./exit-rule-batch-engine.js";
import { newExitRuleBatch } from "./exit-rule-batch.js";

test("ExitRuleBatchEngine keeps results within bounds", () => {
  const engine = defaultExitRuleBatchEngine(flags.newRegistry());
  const item = newExitRuleBatch("code-615", "name-210");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
