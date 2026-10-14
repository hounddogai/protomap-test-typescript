import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewAssignmentEngine } from "./ticket-view-assignment-engine.js";
import { newTicketViewAssignment } from "./ticket-view-assignment.js";

test("TicketViewAssignmentEngine keeps results within bounds", () => {
  const engine = defaultTicketViewAssignmentEngine(flags.newRegistry());
  const item = newTicketViewAssignment("code-989", "name-298");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
