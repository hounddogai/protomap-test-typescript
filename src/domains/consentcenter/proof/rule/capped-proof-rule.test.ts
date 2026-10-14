import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedProofRule } from "./capped-proof-rule.js";

test("CappedProofRule starts in requested", () => {
  const item = newCappedProofRule("code-487", "label-334");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedProofRule moves to granted", () => {
  const item = newCappedProofRule("code-487", "label-334");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedProofRule rejects moves from expired", () => {
  const item = newCappedProofRule("code-487", "label-334");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
