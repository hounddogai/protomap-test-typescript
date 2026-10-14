import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSuppressionException } from "./lenient-suppression-exception.js";

test("LenientSuppressionException starts in planned", () => {
  const item = newLenientSuppressionException("code-118", "title-329");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSuppressionException moves to scheduled", () => {
  const item = newLenientSuppressionException("code-118", "title-329");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientSuppressionException rejects moves from cancelled", () => {
  const item = newLenientSuppressionException("code-118", "title-329");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
