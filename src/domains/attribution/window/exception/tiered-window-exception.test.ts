import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWindowException } from "./tiered-window-exception.js";

test("TieredWindowException starts in planned", () => {
  const item = newTieredWindowException("code-333", "title-955");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWindowException moves to completed", () => {
  const item = newTieredWindowException("code-333", "title-955");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredWindowException rejects moves from cancelled", () => {
  const item = newTieredWindowException("code-333", "title-955");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
