import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteRecord } from "./invite-record.js";

test("InviteRecord starts in requested", () => {
  const item = newInviteRecord("code-738", "title-937");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteRecord moves to revoked", () => {
  const item = newInviteRecord("code-738", "title-937");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("InviteRecord rejects moves from expired", () => {
  const item = newInviteRecord("code-738", "title-937");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
