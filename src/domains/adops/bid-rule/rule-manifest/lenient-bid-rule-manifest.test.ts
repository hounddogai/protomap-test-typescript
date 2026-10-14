import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBidRuleManifest } from "./lenient-bid-rule-manifest.js";

test("LenientBidRuleManifest starts in draft", () => {
  const item = newLenientBidRuleManifest("code-342", "name-721");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBidRuleManifest moves to suspended", () => {
  const item = newLenientBidRuleManifest("code-342", "name-721");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LenientBidRuleManifest rejects moves from closed", () => {
  const item = newLenientBidRuleManifest("code-342", "name-721");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
