import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReplyClaim } from "./lenient-reply-claim.js";

test("LenientReplyClaim starts in new", () => {
  const item = newLenientReplyClaim("code-923", "label-218");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReplyClaim moves to failed", () => {
  const item = newLenientReplyClaim("code-923", "label-218");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("LenientReplyClaim rejects moves from failed", () => {
  const item = newLenientReplyClaim("code-923", "label-218");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
