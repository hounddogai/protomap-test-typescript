import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

test("AdaptiveBounceNotice starts in draft", () => {
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBounceNotice moves to active", () => {
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveBounceNotice rejects moves from closed", () => {
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
