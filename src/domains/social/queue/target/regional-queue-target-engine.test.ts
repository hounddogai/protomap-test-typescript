import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalQueueTargetEngine } from "./regional-queue-target-engine.js";
import { newRegionalQueueTarget } from "./regional-queue-target.js";

test("RegionalQueueTargetEngine keeps results within bounds", () => {
  const engine = defaultRegionalQueueTargetEngine();
  const item = newRegionalQueueTarget("code-792", "name-286");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
