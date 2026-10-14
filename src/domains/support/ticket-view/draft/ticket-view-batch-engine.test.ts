import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewBatchEngine } from "./ticket-view-batch-engine.js";
import { newTicketViewBatch } from "./ticket-view-batch.js";

test("TicketViewBatchEngine keeps results within bounds", () => {
  const engine = defaultTicketViewBatchEngine();
  const item = newTicketViewBatch("code-16", "title-314");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
