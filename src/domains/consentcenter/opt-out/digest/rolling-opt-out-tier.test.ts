import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutTier } from "./rolling-opt-out-tier.js";

test("RollingOptOutTier starts in requested", () => {
  const item = newRollingOptOutTier("code-183", "title-690");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutTier moves to granted", () => {
  const item = newRollingOptOutTier("code-183", "title-690");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingOptOutTier rejects moves from expired", () => {
  const item = newRollingOptOutTier("code-183", "title-690");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
