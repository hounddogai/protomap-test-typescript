import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceRecord } from "./bounce-record.js";

test("BounceRecord starts in draft", () => {
  const item = newBounceRecord("code-343", "label-218");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceRecord moves to pending", () => {
  const item = newBounceRecord("code-343", "label-218");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BounceRecord rejects moves from closed", () => {
  const item = newBounceRecord("code-343", "label-218");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
