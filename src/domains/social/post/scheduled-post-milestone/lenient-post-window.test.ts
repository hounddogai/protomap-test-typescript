import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostWindow } from "./lenient-post-window.js";

test("LenientPostWindow starts in draft", () => {
  const item = newLenientPostWindow("code-386", "label-521");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostWindow moves to pending", () => {
  const item = newLenientPostWindow("code-386", "label-521");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientPostWindow rejects moves from closed", () => {
  const item = newLenientPostWindow("code-386", "label-521");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
