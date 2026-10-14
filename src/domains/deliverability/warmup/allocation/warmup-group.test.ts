import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupGroup } from "./warmup-group.js";

test("WarmupGroup starts in planned", () => {
  const item = newWarmupGroup("code-664", "title-707");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupGroup moves to cancelled", () => {
  const item = newWarmupGroup("code-664", "title-707");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WarmupGroup rejects moves from cancelled", () => {
  const item = newWarmupGroup("code-664", "title-707");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
