import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelNotice } from "./model-notice.js";

test("ModelNotice starts in draft", () => {
  const item = newModelNotice("code-66", "label-643");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelNotice moves to pending", () => {
  const item = newModelNotice("code-66", "label-643");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ModelNotice rejects moves from closed", () => {
  const item = newModelNotice("code-66", "label-643");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
