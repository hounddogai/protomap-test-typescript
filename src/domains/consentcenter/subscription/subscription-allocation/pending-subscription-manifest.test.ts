import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

test("PendingSubscriptionManifest starts in created", () => {
  const item = newPendingSubscriptionManifest("code-791", "title-621");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSubscriptionManifest moves to validated", () => {
  const item = newPendingSubscriptionManifest("code-791", "title-621");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingSubscriptionManifest rejects moves from retired", () => {
  const item = newPendingSubscriptionManifest("code-791", "title-621");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
