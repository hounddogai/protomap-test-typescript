import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalQueueRuleEngine } from "./regional-queue-rule-engine.js";
import { newRegionalQueueRule } from "./regional-queue-rule.js";

test("RegionalQueueRuleEngine keeps results within bounds", () => {
  const engine = defaultRegionalQueueRuleEngine(flags.newRegistry());
  const item = newRegionalQueueRule("code-6", "name-241");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
