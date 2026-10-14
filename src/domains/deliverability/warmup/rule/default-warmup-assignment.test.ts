import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("DefaultWarmupAssignment starts in requested", () => {
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultWarmupAssignment moves to revoked", () => {
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DefaultWarmupAssignment rejects moves from expired", () => {
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
