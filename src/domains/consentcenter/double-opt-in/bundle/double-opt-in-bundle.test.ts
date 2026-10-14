import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInBundle } from "./double-opt-in-bundle.js";

test("DoubleOptInBundle starts in requested", () => {
  const item = newDoubleOptInBundle("code-220", "name-707");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInBundle moves to revoked", () => {
  const item = newDoubleOptInBundle("code-220", "name-707");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DoubleOptInBundle rejects moves from expired", () => {
  const item = newDoubleOptInBundle("code-220", "name-707");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
