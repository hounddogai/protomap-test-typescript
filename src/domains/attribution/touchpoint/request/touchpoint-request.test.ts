import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointRequest } from "./touchpoint-request.js";

test("TouchpointRequest starts in draft", () => {
  const item = newTouchpointRequest("code-139", "name-183");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointRequest moves to pending", () => {
  const item = newTouchpointRequest("code-139", "name-183");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TouchpointRequest rejects moves from closed", () => {
  const item = newTouchpointRequest("code-139", "name-183");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
