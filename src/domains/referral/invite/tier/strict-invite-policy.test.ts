import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictInvitePolicy } from "./strict-invite-policy.js";

test("StrictInvitePolicy starts in requested", () => {
  const item = newStrictInvitePolicy("code-713", "title-412");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictInvitePolicy moves to granted", () => {
  const item = newStrictInvitePolicy("code-713", "title-412");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictInvitePolicy rejects moves from expired", () => {
  const item = newStrictInvitePolicy("code-713", "title-412");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
