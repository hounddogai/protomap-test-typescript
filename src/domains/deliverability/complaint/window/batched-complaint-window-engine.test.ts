import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedComplaintWindowEngine } from "./batched-complaint-window-engine.js";
import { newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("BatchedComplaintWindowEngine keeps results within bounds", () => {
  const engine = defaultBatchedComplaintWindowEngine();
  const item = newBatchedComplaintWindow("code-518", "title-376");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
