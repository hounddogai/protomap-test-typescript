import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryQueueRollupEngine } from "./primary-queue-rollup-engine.js";
import { newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("PrimaryQueueRollupEngine keeps results within bounds", () => {
  const engine = defaultPrimaryQueueRollupEngine();
  const item = newPrimaryQueueRollup("code-580", "title-442");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
