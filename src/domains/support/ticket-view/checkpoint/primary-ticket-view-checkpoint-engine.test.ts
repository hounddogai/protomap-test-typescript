import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryTicketViewCheckpointEngine } from "./primary-ticket-view-checkpoint-engine.js";
import { newPrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

test("PrimaryTicketViewCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimaryTicketViewCheckpointEngine();
  const item = newPrimaryTicketViewCheckpoint("code-277", "title-618");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
