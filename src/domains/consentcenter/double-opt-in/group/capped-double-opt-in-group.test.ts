import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDoubleOptInGroup } from "./capped-double-opt-in-group.js";

test("CappedDoubleOptInGroup starts in requested", () => {
  const item = newCappedDoubleOptInGroup("code-315", "label-244");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDoubleOptInGroup moves to revoked", () => {
  const item = newCappedDoubleOptInGroup("code-315", "label-244");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CappedDoubleOptInGroup rejects moves from expired", () => {
  const item = newCappedDoubleOptInGroup("code-315", "label-244");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
