import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedDeflectionBundleEngine } from "./batched-deflection-bundle-engine.js";
import { newBatchedDeflectionBundle } from "./batched-deflection-bundle.js";

test("BatchedDeflectionBundleEngine keeps results within bounds", () => {
  const engine = defaultBatchedDeflectionBundleEngine();
  const item = newBatchedDeflectionBundle("code-909", "label-552");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
