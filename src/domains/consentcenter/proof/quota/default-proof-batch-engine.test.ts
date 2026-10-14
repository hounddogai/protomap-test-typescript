import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultProofBatchEngine } from "./default-proof-batch-engine.js";
import { newDefaultProofBatch } from "./default-proof-batch.js";

test("DefaultProofBatchEngine keeps results within bounds", () => {
  const engine = defaultDefaultProofBatchEngine();
  const item = newDefaultProofBatch("code-457", "title-654");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
