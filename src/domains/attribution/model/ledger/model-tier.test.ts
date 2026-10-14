import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelTier } from "./model-tier.js";

test("ModelTier starts in draft", () => {
  const item = newModelTier("code-602", "name-225");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelTier moves to active", () => {
  const item = newModelTier("code-602", "name-225");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ModelTier rejects moves from closed", () => {
  const item = newModelTier("code-602", "name-225");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
