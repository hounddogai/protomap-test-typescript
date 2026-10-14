import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientQueuePolicyEngine } from "./lenient-queue-policy-engine.js";
import { newLenientQueuePolicy } from "./lenient-queue-policy.js";

test("LenientQueuePolicyEngine keeps results within bounds", () => {
  const engine = defaultLenientQueuePolicyEngine(flags.newRegistry());
  const item = newLenientQueuePolicy("code-744", "name-691");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
