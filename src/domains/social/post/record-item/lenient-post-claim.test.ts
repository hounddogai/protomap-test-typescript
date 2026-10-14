import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostClaim } from "./lenient-post-claim.js";

test("LenientPostClaim starts in planned", () => {
  const item = newLenientPostClaim("code-620", "title-257");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostClaim moves to completed", () => {
  const item = newLenientPostClaim("code-620", "title-257");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LenientPostClaim rejects moves from cancelled", () => {
  const item = newLenientPostClaim("code-620", "title-257");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
