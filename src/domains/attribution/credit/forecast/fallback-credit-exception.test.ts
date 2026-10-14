import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreditException } from "./fallback-credit-exception.js";

test("FallbackCreditException starts in open", () => {
  const item = newFallbackCreditException("code-289", "label-584");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreditException moves to in review", () => {
  const item = newFallbackCreditException("code-289", "label-584");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackCreditException rejects moves from archived", () => {
  const item = newFallbackCreditException("code-289", "label-584");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
