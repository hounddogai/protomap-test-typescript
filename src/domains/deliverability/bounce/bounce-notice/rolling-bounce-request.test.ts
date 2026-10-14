import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingBounceRequest } from "./rolling-bounce-request.js";

test("RollingBounceRequest starts in draft", () => {
  const item = newRollingBounceRequest("code-132", "label-451");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingBounceRequest moves to pending", () => {
  const item = newRollingBounceRequest("code-132", "label-451");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingBounceRequest rejects moves from closed", () => {
  const item = newRollingBounceRequest("code-132", "label-451");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
