import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallDigest } from "./paywall-digest.js";

test("PaywallDigest starts in proposed", () => {
  const item = newPaywallDigest("code-477", "label-705");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallDigest moves to withdrawn", () => {
  const item = newPaywallDigest("code-477", "label-705");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PaywallDigest rejects moves from withdrawn", () => {
  const item = newPaywallDigest("code-477", "label-705");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
