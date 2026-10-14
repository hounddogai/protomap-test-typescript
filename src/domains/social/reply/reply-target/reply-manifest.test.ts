import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyManifest } from "./reply-manifest.js";

test("ReplyManifest starts in requested", () => {
  const item = newReplyManifest("code-655", "name-501");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyManifest moves to expired", () => {
  const item = newReplyManifest("code-655", "name-501");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ReplyManifest rejects moves from expired", () => {
  const item = newReplyManifest("code-655", "name-501");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
