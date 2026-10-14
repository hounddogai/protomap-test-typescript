import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLevelRule } from "./fallback-level-rule.js";

test("FallbackLevelRule starts in requested", () => {
  const item = newFallbackLevelRule("code-642", "label-513");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLevelRule moves to granted", () => {
  const item = newFallbackLevelRule("code-642", "label-513");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FallbackLevelRule rejects moves from expired", () => {
  const item = newFallbackLevelRule("code-642", "label-513");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
