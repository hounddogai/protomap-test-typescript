import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderThreshold } from "./sender-threshold.js";

test("SenderThreshold starts in draft", () => {
  const item = newSenderThreshold("code-612", "title-99");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderThreshold moves to suspended", () => {
  const item = newSenderThreshold("code-612", "title-99");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SenderThreshold rejects moves from closed", () => {
  const item = newSenderThreshold("code-612", "title-99");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
