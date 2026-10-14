import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallManifest } from "./paywall-manifest.js";

test("PaywallManifest starts in proposed", () => {
  const item = newPaywallManifest("code-978", "name-803");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallManifest moves to withdrawn", () => {
  const item = newPaywallManifest("code-978", "name-803");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PaywallManifest rejects moves from withdrawn", () => {
  const item = newPaywallManifest("code-978", "name-803");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
