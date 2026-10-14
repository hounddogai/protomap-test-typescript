import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeBatchEngine } from "./badge-batch-engine.js";
import { newBadgeBatch } from "./badge-batch.js";

test("BadgeBatchEngine keeps results within bounds", () => {
  const engine = defaultBadgeBatchEngine();
  const item = newBadgeBatch("code-906", "name-468");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
