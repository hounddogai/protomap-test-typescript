import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeBaseline } from "./badge-baseline.js";

test("BadgeBaseline starts in requested", () => {
  const item = newBadgeBaseline("code-421", "name-361");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeBaseline moves to revoked", () => {
  const item = newBadgeBaseline("code-421", "name-361");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BadgeBaseline rejects moves from expired", () => {
  const item = newBadgeBaseline("code-421", "name-361");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
