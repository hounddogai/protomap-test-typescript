import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionClaim } from "./suppression-claim.js";

test("SuppressionClaim starts in open", () => {
  const item = newSuppressionClaim("code-949", "label-317");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionClaim moves to archived", () => {
  const item = newSuppressionClaim("code-949", "label-317");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SuppressionClaim rejects moves from archived", () => {
  const item = newSuppressionClaim("code-949", "label-317");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
