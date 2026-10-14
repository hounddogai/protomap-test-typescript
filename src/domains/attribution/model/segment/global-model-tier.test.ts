import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalModelTier } from "./global-model-tier.js";

test("GlobalModelTier starts in draft", () => {
  const item = newGlobalModelTier("code-947", "name-97");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalModelTier moves to active", () => {
  const item = newGlobalModelTier("code-947", "name-97");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("GlobalModelTier rejects moves from closed", () => {
  const item = newGlobalModelTier("code-947", "name-97");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
