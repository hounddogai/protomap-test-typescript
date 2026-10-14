import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBadgeGroup } from "./default-badge-group.js";

test("DefaultBadgeGroup starts in draft", () => {
  const item = newDefaultBadgeGroup("code-298", "label-500");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBadgeGroup moves to pending", () => {
  const item = newDefaultBadgeGroup("code-298", "label-500");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DefaultBadgeGroup rejects moves from closed", () => {
  const item = newDefaultBadgeGroup("code-298", "label-500");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
