import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutException } from "./opt-out-exception.js";

test("OptOutException starts in draft", () => {
  const item = newOptOutException("code-431", "label-926");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutException moves to pending", () => {
  const item = newOptOutException("code-431", "label-926");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("OptOutException rejects moves from closed", () => {
  const item = newOptOutException("code-431", "label-926");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
