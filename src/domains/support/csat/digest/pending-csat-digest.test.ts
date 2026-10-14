import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCsatDigest } from "./pending-csat-digest.js";

test("PendingCsatDigest starts in requested", () => {
  const item = newPendingCsatDigest("code-572", "label-911");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCsatDigest moves to expired", () => {
  const item = newPendingCsatDigest("code-572", "label-911");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PendingCsatDigest rejects moves from expired", () => {
  const item = newPendingCsatDigest("code-572", "label-911");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
