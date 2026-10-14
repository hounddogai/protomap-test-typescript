import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingDeflectionClaim } from "./rolling-deflection-claim.js";

test("RollingDeflectionClaim starts in open", () => {
  const item = newRollingDeflectionClaim("code-659", "title-387");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingDeflectionClaim moves to in review", () => {
  const item = newRollingDeflectionClaim("code-659", "title-387");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingDeflectionClaim rejects moves from archived", () => {
  const item = newRollingDeflectionClaim("code-659", "title-387");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
