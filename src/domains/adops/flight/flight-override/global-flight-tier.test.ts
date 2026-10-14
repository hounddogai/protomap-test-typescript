import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFlightTier } from "./global-flight-tier.js";

test("GlobalFlightTier starts in draft", () => {
  const item = newGlobalFlightTier("code-843", "name-387");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFlightTier moves to pending", () => {
  const item = newGlobalFlightTier("code-843", "name-387");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalFlightTier rejects moves from closed", () => {
  const item = newGlobalFlightTier("code-843", "name-387");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
