import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingDomainDigest } from "./pending-domain-digest.js";

test("PendingDomainDigest starts in idle", () => {
  const item = newPendingDomainDigest("code-216", "label-908");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingDomainDigest moves to ready", () => {
  const item = newPendingDomainDigest("code-216", "label-908");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingDomainDigest rejects moves from stopped", () => {
  const item = newPendingDomainDigest("code-216", "label-908");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
