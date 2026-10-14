import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

test("DoubleOptInBaseline starts in draft", () => {
  const item = newDoubleOptInBaseline("code-612", "title-98");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInBaseline moves to pending", () => {
  const item = newDoubleOptInBaseline("code-612", "title-98");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DoubleOptInBaseline rejects moves from closed", () => {
  const item = newDoubleOptInBaseline("code-612", "title-98");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
