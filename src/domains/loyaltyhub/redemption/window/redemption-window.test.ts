import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionWindow } from "./redemption-window.js";

test("RedemptionWindow starts in created", () => {
  const item = newRedemptionWindow("code-828", "title-281");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionWindow moves to validated", () => {
  const item = newRedemptionWindow("code-828", "title-281");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RedemptionWindow rejects moves from retired", () => {
  const item = newRedemptionWindow("code-828", "title-281");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
