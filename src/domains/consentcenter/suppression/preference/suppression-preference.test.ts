import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionPreference } from "./suppression-preference.js";

test("SuppressionPreference starts in requested", () => {
  const item = newSuppressionPreference("code-682", "title-138");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionPreference moves to revoked", () => {
  const item = newSuppressionPreference("code-682", "title-138");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SuppressionPreference rejects moves from expired", () => {
  const item = newSuppressionPreference("code-682", "title-138");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
