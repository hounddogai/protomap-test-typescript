import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReputationRule } from "./lenient-reputation-rule.js";

test("LenientReputationRule starts in draft", () => {
  const item = newLenientReputationRule("code-544", "label-960");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReputationRule moves to active", () => {
  const item = newLenientReputationRule("code-544", "label-960");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientReputationRule rejects moves from closed", () => {
  const item = newLenientReputationRule("code-544", "label-960");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
