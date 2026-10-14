import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPostExceptionEngine } from "./batched-post-exception-engine.js";
import { newBatchedPostException } from "./batched-post-exception.js";

test("BatchedPostExceptionEngine keeps results within bounds", () => {
  const engine = defaultBatchedPostExceptionEngine();
  const item = newBatchedPostException("code-231", "title-192");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
