import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyReputationDigest } from "./legacy-reputation-digest.js";

test("LegacyReputationDigest starts in open", () => {
  const item = newLegacyReputationDigest("code-830", "label-59");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyReputationDigest moves to in review", () => {
  const item = newLegacyReputationDigest("code-830", "label-59");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LegacyReputationDigest rejects moves from archived", () => {
  const item = newLegacyReputationDigest("code-830", "label-59");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
