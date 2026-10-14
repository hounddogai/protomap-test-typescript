import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeThreshold } from "./badge-threshold.js";

test("BadgeThreshold starts in draft", () => {
  const item = newBadgeThreshold("code-205", "label-349");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeThreshold moves to suspended", () => {
  const item = newBadgeThreshold("code-205", "label-349");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BadgeThreshold rejects moves from closed", () => {
  const item = newBadgeThreshold("code-205", "label-349");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
