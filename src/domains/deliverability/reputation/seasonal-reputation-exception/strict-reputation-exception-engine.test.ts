import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictReputationExceptionEngine } from "./strict-reputation-exception-engine.js";
import { newStrictReputationException } from "./strict-reputation-exception.js";

test("StrictReputationExceptionEngine keeps results within bounds", () => {
  const engine = defaultStrictReputationExceptionEngine();
  const item = newStrictReputationException("code-375", "name-546");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
