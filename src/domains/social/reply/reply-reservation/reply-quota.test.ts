import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyQuota } from "./reply-quota.js";

test("ReplyQuota starts in requested", () => {
  const item = newReplyQuota("code-181", "label-486");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyQuota moves to revoked", () => {
  const item = newReplyQuota("code-181", "label-486");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ReplyQuota rejects moves from expired", () => {
  const item = newReplyQuota("code-181", "label-486");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
