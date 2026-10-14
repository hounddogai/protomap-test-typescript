import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionRequest } from "./redemption-request.js";

test("RedemptionRequest starts in open", () => {
  const item = newRedemptionRequest("code-262", "name-28");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionRequest moves to resolved", () => {
  const item = newRedemptionRequest("code-262", "name-28");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RedemptionRequest rejects moves from archived", () => {
  const item = newRedemptionRequest("code-262", "name-28");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
