import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryInviteAssignmentEngine } from "./primary-invite-assignment-engine.js";
import { newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

test("PrimaryInviteAssignmentEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInviteAssignmentEngine();
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
