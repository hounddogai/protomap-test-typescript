import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultModelTier } from "./default-model-tier.js";

test("DefaultModelTier starts in planned", () => {
  const item = newDefaultModelTier("code-948", "label-249");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultModelTier moves to in progress", () => {
  const item = newDefaultModelTier("code-948", "label-249");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultModelTier rejects moves from cancelled", () => {
  const item = newDefaultModelTier("code-948", "label-249");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
