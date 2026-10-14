import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientRetentionRequestEngine } from "./lenient-retention-request-engine.js";
import { newLenientRetentionRequest } from "./lenient-retention-request.js";

test("LenientRetentionRequestEngine keeps results within bounds", () => {
  const engine = defaultLenientRetentionRequestEngine();
  const item = newLenientRetentionRequest("code-651", "label-80");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
