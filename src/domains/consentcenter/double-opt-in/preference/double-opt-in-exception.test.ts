import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInException } from "./double-opt-in-exception.js";

test("DoubleOptInException starts in new", () => {
  const item = newDoubleOptInException("code-721", "name-728");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInException moves to queued", () => {
  const item = newDoubleOptInException("code-721", "name-728");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("DoubleOptInException rejects moves from failed", () => {
  const item = newDoubleOptInException("code-721", "name-728");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
