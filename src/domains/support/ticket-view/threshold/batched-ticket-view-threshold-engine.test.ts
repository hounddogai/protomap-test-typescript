import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedTicketViewThresholdEngine } from "./batched-ticket-view-threshold-engine.js";
import { newBatchedTicketViewThreshold } from "./batched-ticket-view-threshold.js";

test("BatchedTicketViewThresholdEngine keeps results within bounds", () => {
  const engine = defaultBatchedTicketViewThresholdEngine();
  const item = newBatchedTicketViewThreshold("code-526", "name-951");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
