import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationMappingEngine } from "./reputation-mapping-engine.js";
import { newReputationMapping } from "./reputation-mapping.js";

test("ReputationMappingEngine keeps results within bounds", () => {
  const engine = defaultReputationMappingEngine(flags.newRegistry());
  const item = newReputationMapping("code-218", "name-579");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
