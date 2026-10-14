import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierRequestEngine } from "./tier-request-engine.js";
import { newTierRequest } from "./tier-request.js";

test("TierRequestEngine keeps results within bounds", () => {
  const engine = defaultTierRequestEngine();
  const item = newTierRequest("code-963", "name-754");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
