import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPlacementAudit } from "./rolling-placement-audit.js";

test("RollingPlacementAudit starts in draft", () => {
  const item = newRollingPlacementAudit("code-145", "label-679");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPlacementAudit moves to active", () => {
  const item = newRollingPlacementAudit("code-145", "label-679");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingPlacementAudit rejects moves from closed", () => {
  const item = newRollingPlacementAudit("code-145", "label-679");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
