import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedTicketViewCheckpointEngine } from "./capped-ticket-view-checkpoint-engine.js";
import { newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

test("CappedTicketViewCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCappedTicketViewCheckpointEngine();
  const item = newCappedTicketViewCheckpoint("code-151", "title-281");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
