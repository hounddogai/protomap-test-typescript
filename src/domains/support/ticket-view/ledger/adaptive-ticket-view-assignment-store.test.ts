import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTicketViewAssignmentStore } from "./adaptive-ticket-view-assignment-store.js";
import { newAdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

test("MemoryAdaptiveTicketViewAssignmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveTicketViewAssignmentStore();
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
