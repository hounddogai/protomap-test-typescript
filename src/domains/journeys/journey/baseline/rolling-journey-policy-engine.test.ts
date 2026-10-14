import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingJourneyPolicyEngine } from "./rolling-journey-policy-engine.js";
import { newRollingJourneyPolicy } from "./rolling-journey-policy.js";

test("RollingJourneyPolicyEngine keeps results within bounds", () => {
  const engine = defaultRollingJourneyPolicyEngine();
  const item = newRollingJourneyPolicy("code-501", "label-366");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
