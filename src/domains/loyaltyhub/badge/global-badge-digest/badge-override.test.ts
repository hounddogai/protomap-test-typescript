import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeOverride } from "./badge-override.js";

test("BadgeOverride starts in requested", () => {
  const item = newBadgeOverride("code-189", "title-206");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeOverride moves to revoked", () => {
  const item = newBadgeOverride("code-189", "title-206");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BadgeOverride rejects moves from expired", () => {
  const item = newBadgeOverride("code-189", "title-206");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
