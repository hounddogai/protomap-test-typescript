import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeProfile } from "./badge-profile.js";

test("BadgeProfile starts in requested", () => {
  const item = newBadgeProfile("code-997", "title-498");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeProfile moves to expired", () => {
  const item = newBadgeProfile("code-997", "title-498");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BadgeProfile rejects moves from expired", () => {
  const item = newBadgeProfile("code-997", "title-498");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
