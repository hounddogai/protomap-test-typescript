import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedLevelEntry } from "./batched-level-entry.js";

test("BatchedLevelEntry starts in requested", () => {
  const item = newBatchedLevelEntry("code-792", "name-116");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedLevelEntry moves to revoked", () => {
  const item = newBatchedLevelEntry("code-792", "name-116");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BatchedLevelEntry rejects moves from expired", () => {
  const item = newBatchedLevelEntry("code-792", "name-116");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
