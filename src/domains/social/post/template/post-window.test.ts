import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostWindow } from "./post-window.js";

test("PostWindow starts in created", () => {
  const item = newPostWindow("code-849", "label-755");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostWindow moves to published", () => {
  const item = newPostWindow("code-849", "label-755");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PostWindow rejects moves from retired", () => {
  const item = newPostWindow("code-849", "label-755");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
