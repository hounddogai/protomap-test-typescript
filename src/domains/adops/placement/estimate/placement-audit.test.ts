import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementAudit } from "./placement-audit.js";

test("PlacementAudit starts in draft", () => {
  const item = newPlacementAudit("code-963", "name-826");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementAudit moves to suspended", () => {
  const item = newPlacementAudit("code-963", "name-826");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PlacementAudit rejects moves from closed", () => {
  const item = newPlacementAudit("code-963", "name-826");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
