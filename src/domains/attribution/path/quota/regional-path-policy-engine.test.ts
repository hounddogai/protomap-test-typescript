import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPathPolicyEngine } from "./regional-path-policy-engine.js";
import { newRegionalPathPolicy } from "./regional-path-policy.js";

test("RegionalPathPolicyEngine keeps results within bounds", () => {
  const engine = defaultRegionalPathPolicyEngine(flags.newRegistry());
  const item = newRegionalPathPolicy("code-700", "label-423");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
