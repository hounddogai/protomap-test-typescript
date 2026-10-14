import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInviteEntry } from "./primary-invite-entry.js";

test("PrimaryInviteEntry starts in draft", () => {
  const item = newPrimaryInviteEntry("code-59", "title-421");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInviteEntry moves to closed", () => {
  const item = newPrimaryInviteEntry("code-59", "title-421");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("PrimaryInviteEntry rejects moves from closed", () => {
  const item = newPrimaryInviteEntry("code-59", "title-421");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
