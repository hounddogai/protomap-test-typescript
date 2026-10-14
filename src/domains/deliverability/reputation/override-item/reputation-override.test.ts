import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationOverride } from "./reputation-override.js";

test("ReputationOverride starts in requested", () => {
  const item = newReputationOverride("code-463", "label-98");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationOverride moves to granted", () => {
  const item = newReputationOverride("code-463", "label-98");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReputationOverride rejects moves from expired", () => {
  const item = newReputationOverride("code-463", "label-98");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
