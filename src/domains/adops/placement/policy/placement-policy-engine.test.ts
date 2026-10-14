import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementPolicyEngine } from "./placement-policy-engine.js";
import { newPlacementPolicy } from "./placement-policy.js";

test("PlacementPolicyEngine keeps results within bounds", () => {
  const engine = defaultPlacementPolicyEngine(flags.newRegistry());
  const item = newPlacementPolicy("code-754", "title-980");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
