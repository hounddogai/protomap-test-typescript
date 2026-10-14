import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyClaim } from "./reply-claim.js";

test("ReplyClaim starts in planned", () => {
  const item = newReplyClaim("code-249", "name-713");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyClaim moves to in progress", () => {
  const item = newReplyClaim("code-249", "name-713");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReplyClaim rejects moves from cancelled", () => {
  const item = newReplyClaim("code-249", "name-713");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
