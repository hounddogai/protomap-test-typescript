import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewRequestEngine } from "./ticket-view-request-engine.js";
import { newTicketViewRequest } from "./ticket-view-request.js";

test("TicketViewRequestEngine keeps results within bounds", () => {
  const engine = defaultTicketViewRequestEngine();
  const item = newTicketViewRequest("code-723", "label-723");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
