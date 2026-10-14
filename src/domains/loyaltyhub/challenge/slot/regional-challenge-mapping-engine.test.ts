import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalChallengeMappingEngine } from "./regional-challenge-mapping-engine.js";
import { newRegionalChallengeMapping } from "./regional-challenge-mapping.js";

test("RegionalChallengeMappingEngine keeps results within bounds", () => {
  const engine = defaultRegionalChallengeMappingEngine();
  const item = newRegionalChallengeMapping("code-781", "label-59");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
