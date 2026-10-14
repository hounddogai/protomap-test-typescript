import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalExitRuleDigest } from "./global-exit-rule-digest.js";

test("GlobalExitRuleDigest starts in requested", () => {
  const item = newGlobalExitRuleDigest("code-198", "label-463");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalExitRuleDigest moves to granted", () => {
  const item = newGlobalExitRuleDigest("code-198", "label-463");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalExitRuleDigest rejects moves from expired", () => {
  const item = newGlobalExitRuleDigest("code-198", "label-463");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
