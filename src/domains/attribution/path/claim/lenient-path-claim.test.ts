import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPathClaim } from "./lenient-path-claim.js";

test("LenientPathClaim starts in planned", () => {
  const item = newLenientPathClaim("code-157", "name-35");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPathClaim moves to scheduled", () => {
  const item = newLenientPathClaim("code-157", "name-35");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientPathClaim rejects moves from cancelled", () => {
  const item = newLenientPathClaim("code-157", "name-35");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
