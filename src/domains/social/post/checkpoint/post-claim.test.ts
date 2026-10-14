import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostClaim } from "./post-claim.js";

test("PostClaim starts in planned", () => {
  const item = newPostClaim("code-308", "label-16");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostClaim moves to cancelled", () => {
  const item = newPostClaim("code-308", "label-16");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PostClaim rejects moves from cancelled", () => {
  const item = newPostClaim("code-308", "label-16");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
