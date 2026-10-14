import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostRecord } from "./post-record.js";

test("PostRecord starts in open", () => {
  const item = newPostRecord("code-334", "label-155");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostRecord moves to resolved", () => {
  const item = newPostRecord("code-334", "label-155");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PostRecord rejects moves from archived", () => {
  const item = newPostRecord("code-334", "label-155");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
