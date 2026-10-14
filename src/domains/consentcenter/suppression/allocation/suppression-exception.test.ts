import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionException } from "./suppression-exception.js";

test("SuppressionException starts in draft", () => {
  const item = newSuppressionException("code-827", "title-910");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionException moves to pending", () => {
  const item = newSuppressionException("code-827", "title-910");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SuppressionException rejects moves from closed", () => {
  const item = newSuppressionException("code-827", "title-910");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
