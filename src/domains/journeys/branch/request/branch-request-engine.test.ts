import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchRequestEngine } from "./branch-request-engine.js";
import { newBranchRequest } from "./branch-request.js";

test("BranchRequestEngine keeps results within bounds", () => {
  const engine = defaultBranchRequestEngine();
  const item = newBranchRequest("code-806", "title-506");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
