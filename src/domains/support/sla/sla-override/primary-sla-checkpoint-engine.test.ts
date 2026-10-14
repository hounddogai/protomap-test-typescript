import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySlaCheckpointEngine } from "./primary-sla-checkpoint-engine.js";
import { newPrimarySlaCheckpoint } from "./primary-sla-checkpoint.js";

test("PrimarySlaCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimarySlaCheckpointEngine();
  const item = newPrimarySlaCheckpoint("code-695", "title-585");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
