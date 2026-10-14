import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionBaseline } from "./retention-baseline.js";

test("RetentionBaseline starts in requested", () => {
  const item = newRetentionBaseline("code-327", "title-331");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionBaseline moves to revoked", () => {
  const item = newRetentionBaseline("code-327", "title-331");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RetentionBaseline rejects moves from expired", () => {
  const item = newRetentionBaseline("code-327", "title-331");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
