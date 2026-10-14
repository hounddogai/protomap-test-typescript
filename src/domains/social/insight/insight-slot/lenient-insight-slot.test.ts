import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientInsightSlot } from "./lenient-insight-slot.js";

test("LenientInsightSlot starts in new", () => {
  const item = newLenientInsightSlot("code-302", "title-263");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientInsightSlot moves to queued", () => {
  const item = newLenientInsightSlot("code-302", "title-263");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientInsightSlot rejects moves from failed", () => {
  const item = newLenientInsightSlot("code-302", "title-263");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
