import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

test("FallbackFraudCheckException starts in proposed", () => {
  const item = newFallbackFraudCheckException("code-932", "label-727");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckException moves to approved", () => {
  const item = newFallbackFraudCheckException("code-932", "label-727");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackFraudCheckException rejects moves from withdrawn", () => {
  const item = newFallbackFraudCheckException("code-932", "label-727");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
