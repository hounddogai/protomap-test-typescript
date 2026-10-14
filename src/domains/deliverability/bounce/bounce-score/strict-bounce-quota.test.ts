import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBounceQuota } from "./strict-bounce-quota.js";

test("StrictBounceQuota starts in requested", () => {
  const item = newStrictBounceQuota("code-950", "name-234");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBounceQuota moves to revoked", () => {
  const item = newStrictBounceQuota("code-950", "name-234");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictBounceQuota rejects moves from expired", () => {
  const item = newStrictBounceQuota("code-950", "name-234");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
