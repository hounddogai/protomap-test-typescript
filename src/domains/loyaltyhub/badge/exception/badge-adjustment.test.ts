import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeAdjustment } from "./badge-adjustment.js";

test("BadgeAdjustment starts in created", () => {
  const item = newBadgeAdjustment("code-563", "title-705");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeAdjustment moves to retired", () => {
  const item = newBadgeAdjustment("code-563", "title-705");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("BadgeAdjustment rejects moves from retired", () => {
  const item = newBadgeAdjustment("code-563", "title-705");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
