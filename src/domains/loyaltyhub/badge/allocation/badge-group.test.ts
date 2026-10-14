import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeGroup } from "./badge-group.js";

test("BadgeGroup starts in requested", () => {
  const item = newBadgeGroup("code-433", "title-238");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeGroup moves to expired", () => {
  const item = newBadgeGroup("code-433", "title-238");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BadgeGroup rejects moves from expired", () => {
  const item = newBadgeGroup("code-433", "title-238");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
