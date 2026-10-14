import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedLevelEntryEngine } from "./batched-level-entry-engine.js";
import { newBatchedLevelEntry } from "./batched-level-entry.js";

test("BatchedLevelEntryEngine keeps results within bounds", () => {
  const engine = defaultBatchedLevelEntryEngine();
  const item = newBatchedLevelEntry("code-792", "name-116");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
