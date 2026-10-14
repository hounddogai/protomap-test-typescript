import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionScore } from "./conversion-score.js";

test("ConversionScore starts in open", () => {
  const item = newConversionScore("code-865", "label-625");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionScore moves to resolved", () => {
  const item = newConversionScore("code-865", "label-625");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ConversionScore rejects moves from archived", () => {
  const item = newConversionScore("code-865", "label-625");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
