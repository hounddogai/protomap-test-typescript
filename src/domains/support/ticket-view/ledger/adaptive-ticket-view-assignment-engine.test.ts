import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveTicketViewAssignmentEngine } from "./adaptive-ticket-view-assignment-engine.js";
import { newAdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

test("AdaptiveTicketViewAssignmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveTicketViewAssignmentEngine();
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
