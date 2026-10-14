import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationTargetEngine } from "./reputation-target-engine.js";
import { newReputationTarget } from "./reputation-target.js";

test("ReputationTargetEngine keeps results within bounds", () => {
  const engine = defaultReputationTargetEngine();
  const item = newReputationTarget("code-798", "title-577");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
