import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationAssignment } from "./activation-assignment.js";

test("ActivationAssignment starts in requested", () => {
  const item = newActivationAssignment("code-249", "name-773");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationAssignment moves to expired", () => {
  const item = newActivationAssignment("code-249", "name-773");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ActivationAssignment rejects moves from expired", () => {
  const item = newActivationAssignment("code-249", "name-773");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
