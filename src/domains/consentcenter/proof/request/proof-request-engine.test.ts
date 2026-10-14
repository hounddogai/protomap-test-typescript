import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofRequestEngine } from "./proof-request-engine.js";
import { newProofRequest } from "./proof-request.js";

test("ProofRequestEngine keeps results within bounds", () => {
  const engine = defaultProofRequestEngine();
  const item = newProofRequest("code-495", "label-148");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
