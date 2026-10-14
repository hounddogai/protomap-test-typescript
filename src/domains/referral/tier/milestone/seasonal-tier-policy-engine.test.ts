import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalTierPolicyEngine } from "./seasonal-tier-policy-engine.js";
import { newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

test("SeasonalTierPolicyEngine keeps results within bounds", () => {
  const engine = defaultSeasonalTierPolicyEngine(flags.newRegistry());
  const item = newSeasonalTierPolicy("code-962", "title-682");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
