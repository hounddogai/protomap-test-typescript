import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTierPolicy } from "./strict-tier-policy.js";

test("StrictTierPolicy starts in requested", () => {
  const item = newStrictTierPolicy("code-628", "label-103");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTierPolicy moves to revoked", () => {
  const item = newStrictTierPolicy("code-628", "label-103");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictTierPolicy rejects moves from expired", () => {
  const item = newStrictTierPolicy("code-628", "label-103");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
