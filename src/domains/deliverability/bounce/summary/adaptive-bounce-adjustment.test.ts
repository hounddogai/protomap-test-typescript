import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

test("AdaptiveBounceAdjustment starts in requested", () => {
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBounceAdjustment moves to revoked", () => {
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("AdaptiveBounceAdjustment rejects moves from expired", () => {
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
