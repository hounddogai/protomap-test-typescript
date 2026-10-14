import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictTicketViewBatchEngine } from "./strict-ticket-view-batch-engine.js";
import { newStrictTicketViewBatch } from "./strict-ticket-view-batch.js";

test("StrictTicketViewBatchEngine keeps results within bounds", () => {
  const engine = defaultStrictTicketViewBatchEngine();
  const item = newStrictTicketViewBatch("code-360", "name-617");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
