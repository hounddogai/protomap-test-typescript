import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReplyVariance } from "./tiered-reply-variance.js";

test("TieredReplyVariance starts in draft", () => {
  const item = newTieredReplyVariance("code-982", "title-94");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReplyVariance moves to active", () => {
  const item = newTieredReplyVariance("code-982", "title-94");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredReplyVariance rejects moves from closed", () => {
  const item = newTieredReplyVariance("code-982", "title-94");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
