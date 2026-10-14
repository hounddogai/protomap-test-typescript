import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierPreference } from "./tier-preference.js";

test("TierPreference starts in requested", () => {
  const item = newTierPreference("code-802", "name-237");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierPreference moves to revoked", () => {
  const item = newTierPreference("code-802", "name-237");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TierPreference rejects moves from expired", () => {
  const item = newTierPreference("code-802", "name-237");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
