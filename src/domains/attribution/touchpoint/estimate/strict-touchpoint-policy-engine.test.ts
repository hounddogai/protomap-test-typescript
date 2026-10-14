import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictTouchpointPolicyEngine } from "./strict-touchpoint-policy-engine.js";
import { newStrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

test("StrictTouchpointPolicyEngine keeps results within bounds", () => {
  const engine = defaultStrictTouchpointPolicyEngine(flags.newRegistry());
  const item = newStrictTouchpointPolicy("code-681", "label-917");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
