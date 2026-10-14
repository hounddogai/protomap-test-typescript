import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualInviteTemplate } from "./manual-invite-template.js";

test("ManualInviteTemplate starts in new", () => {
  const item = newManualInviteTemplate("code-468", "name-451");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualInviteTemplate moves to running", () => {
  const item = newManualInviteTemplate("code-468", "name-451");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ManualInviteTemplate rejects moves from failed", () => {
  const item = newManualInviteTemplate("code-468", "name-451");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
