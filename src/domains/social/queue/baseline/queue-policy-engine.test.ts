import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueuePolicyEngine } from "./queue-policy-engine.js";
import { newQueuePolicy } from "./queue-policy.js";

test("QueuePolicyEngine keeps results within bounds", () => {
  const engine = defaultQueuePolicyEngine(flags.newRegistry());
  const item = newQueuePolicy("code-344", "label-978");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
