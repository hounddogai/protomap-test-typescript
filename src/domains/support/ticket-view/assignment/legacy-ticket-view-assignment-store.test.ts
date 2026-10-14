import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTicketViewAssignmentStore } from "./legacy-ticket-view-assignment-store.js";
import { newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

test("MemoryLegacyTicketViewAssignmentStore finds what it saved", () => {
  const store = newMemoryLegacyTicketViewAssignmentStore();
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
