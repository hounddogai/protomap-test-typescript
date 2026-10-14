import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReputationOverride } from "./strict-reputation-override.js";

test("StrictReputationOverride starts in created", () => {
  const item = newStrictReputationOverride("code-407", "label-127");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReputationOverride moves to validated", () => {
  const item = newStrictReputationOverride("code-407", "label-127");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictReputationOverride rejects moves from retired", () => {
  const item = newStrictReputationOverride("code-407", "label-127");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
