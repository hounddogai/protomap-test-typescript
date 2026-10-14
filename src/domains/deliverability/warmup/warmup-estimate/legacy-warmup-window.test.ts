import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWarmupWindow } from "./legacy-warmup-window.js";

test("LegacyWarmupWindow starts in open", () => {
  const item = newLegacyWarmupWindow("code-712", "name-828");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWarmupWindow moves to in review", () => {
  const item = newLegacyWarmupWindow("code-712", "name-828");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LegacyWarmupWindow rejects moves from archived", () => {
  const item = newLegacyWarmupWindow("code-712", "name-828");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
