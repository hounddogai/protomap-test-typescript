import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualOptOutProfile } from "./manual-opt-out-profile.js";

test("ManualOptOutProfile starts in requested", () => {
  const item = newManualOptOutProfile("code-302", "name-104");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualOptOutProfile moves to revoked", () => {
  const item = newManualOptOutProfile("code-302", "name-104");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualOptOutProfile rejects moves from expired", () => {
  const item = newManualOptOutProfile("code-302", "name-104");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
