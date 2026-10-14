import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("GlobalSuppressionAudit starts in requested", () => {
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionAudit moves to granted", () => {
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalSuppressionAudit rejects moves from expired", () => {
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
