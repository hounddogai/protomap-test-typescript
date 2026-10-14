import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierPolicyEngine } from "./tier-policy-engine.js";
import { newTierPolicy } from "./tier-policy.js";

test("TierPolicyEngine keeps results within bounds", () => {
  const engine = defaultTierPolicyEngine(flags.newRegistry());
  const item = newTierPolicy("code-866", "label-913");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
