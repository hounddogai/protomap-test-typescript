import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPlacementNotice } from "./rolling-placement-notice.js";

test("RollingPlacementNotice starts in draft", () => {
  const item = newRollingPlacementNotice("code-845", "name-853");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPlacementNotice moves to active", () => {
  const item = newRollingPlacementNotice("code-845", "name-853");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingPlacementNotice rejects moves from closed", () => {
  const item = newRollingPlacementNotice("code-845", "name-853");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
