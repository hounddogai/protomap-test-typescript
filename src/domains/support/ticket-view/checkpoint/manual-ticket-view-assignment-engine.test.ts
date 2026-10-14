import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualTicketViewAssignmentEngine } from "./manual-ticket-view-assignment-engine.js";
import { newManualTicketViewAssignment } from "./manual-ticket-view-assignment.js";

test("ManualTicketViewAssignmentEngine keeps results within bounds", () => {
  const engine = defaultManualTicketViewAssignmentEngine(flags.newRegistry());
  const item = newManualTicketViewAssignment("code-876", "title-252");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
