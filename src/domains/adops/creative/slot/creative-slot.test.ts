import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeSlot } from "./creative-slot.js";

test("CreativeSlot starts in idle", () => {
  const item = newCreativeSlot("code-105", "label-982");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeSlot moves to warming", () => {
  const item = newCreativeSlot("code-105", "label-982");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CreativeSlot rejects moves from stopped", () => {
  const item = newCreativeSlot("code-105", "label-982");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
