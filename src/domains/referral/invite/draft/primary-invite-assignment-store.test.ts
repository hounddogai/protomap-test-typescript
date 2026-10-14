import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryInviteAssignmentStore } from "./primary-invite-assignment-store.js";
import { newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

test("MemoryPrimaryInviteAssignmentStore finds what it saved", () => {
  const store = newMemoryPrimaryInviteAssignmentStore();
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
