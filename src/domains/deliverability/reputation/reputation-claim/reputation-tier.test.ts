import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationTier } from "./reputation-tier.js";

test("ReputationTier starts in requested", () => {
  const item = newReputationTier("code-750", "title-787");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationTier moves to granted", () => {
  const item = newReputationTier("code-750", "title-787");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReputationTier rejects moves from expired", () => {
  const item = newReputationTier("code-750", "title-787");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
