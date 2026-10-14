import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingTicketViewCheckpointEngine } from "./pending-ticket-view-checkpoint-engine.js";
import { newPendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

test("PendingTicketViewCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPendingTicketViewCheckpointEngine();
  const item = newPendingTicketViewCheckpoint("code-913", "label-642");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
