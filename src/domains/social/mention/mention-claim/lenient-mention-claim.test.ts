import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientMentionClaim } from "./lenient-mention-claim.js";

test("LenientMentionClaim starts in draft", () => {
  const item = newLenientMentionClaim("code-715", "title-241");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientMentionClaim moves to pending", () => {
  const item = newLenientMentionClaim("code-715", "title-241");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientMentionClaim rejects moves from closed", () => {
  const item = newLenientMentionClaim("code-715", "title-241");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
