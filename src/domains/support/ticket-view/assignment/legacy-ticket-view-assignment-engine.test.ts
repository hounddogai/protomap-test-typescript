import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyTicketViewAssignmentEngine } from "./legacy-ticket-view-assignment-engine.js";
import { newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

test("LegacyTicketViewAssignmentEngine keeps results within bounds", () => {
  const engine = defaultLegacyTicketViewAssignmentEngine(flags.newRegistry());
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
