import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortCheckpointEngine } from "./cohort-checkpoint-engine.js";
import { newCohortCheckpoint } from "./cohort-checkpoint.js";

test("CohortCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCohortCheckpointEngine();
  const item = newCohortCheckpoint("code-361", "name-432");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
