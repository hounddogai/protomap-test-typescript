import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPathProfileEngine } from "./batched-path-profile-engine.js";
import { newBatchedPathProfile } from "./batched-path-profile.js";

test("BatchedPathProfileEngine keeps results within bounds", () => {
  const engine = defaultBatchedPathProfileEngine();
  const item = newBatchedPathProfile("code-952", "label-685");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
