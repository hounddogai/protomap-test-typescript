import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreativeSlot } from "./global-creative-slot.js";

test("GlobalCreativeSlot starts in new", () => {
  const item = newGlobalCreativeSlot("code-823", "label-335");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreativeSlot moves to failed", () => {
  const item = newGlobalCreativeSlot("code-823", "label-335");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("GlobalCreativeSlot rejects moves from failed", () => {
  const item = newGlobalCreativeSlot("code-823", "label-335");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
