import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceGroup } from "./bounce-group.js";

test("BounceGroup starts in requested", () => {
  const item = newBounceGroup("code-354", "label-396");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceGroup moves to revoked", () => {
  const item = newBounceGroup("code-354", "label-396");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BounceGroup rejects moves from expired", () => {
  const item = newBounceGroup("code-354", "label-396");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
