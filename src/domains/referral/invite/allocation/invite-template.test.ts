import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteTemplate } from "./invite-template.js";

test("InviteTemplate starts in planned", () => {
  const item = newInviteTemplate("code-346", "label-730");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteTemplate moves to scheduled", () => {
  const item = newInviteTemplate("code-346", "label-730");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("InviteTemplate rejects moves from cancelled", () => {
  const item = newInviteTemplate("code-346", "label-730");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
