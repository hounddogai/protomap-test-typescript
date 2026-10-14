import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionManifest } from "./redemption-manifest.js";

test("RedemptionManifest starts in open", () => {
  const item = newRedemptionManifest("code-445", "title-368");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionManifest moves to resolved", () => {
  const item = newRedemptionManifest("code-445", "title-368");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RedemptionManifest rejects moves from archived", () => {
  const item = newRedemptionManifest("code-445", "title-368");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
