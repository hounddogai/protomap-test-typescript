import assert from "node:assert/strict";
import { test } from "node:test";
import { newInvitePreference } from "./invite-preference.js";

test("InvitePreference starts in requested", () => {
  const item = newInvitePreference("code-399", "name-424");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InvitePreference moves to granted", () => {
  const item = newInvitePreference("code-399", "name-424");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("InvitePreference rejects moves from expired", () => {
  const item = newInvitePreference("code-399", "name-424");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
