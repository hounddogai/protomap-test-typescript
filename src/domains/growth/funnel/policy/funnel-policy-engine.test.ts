import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelPolicyEngine } from "./funnel-policy-engine.js";
import { newFunnelPolicy } from "./funnel-policy.js";

test("FunnelPolicyEngine keeps results within bounds", () => {
  const engine = defaultFunnelPolicyEngine(flags.newRegistry());
  const item = newFunnelPolicy("code-204", "name-167");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
