import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientTierWindow } from "./lenient-tier-window.js";

test("LenientTierWindow starts in open", () => {
  const item = newLenientTierWindow("code-517", "name-125");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientTierWindow moves to in review", () => {
  const item = newLenientTierWindow("code-517", "name-125");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientTierWindow rejects moves from archived", () => {
  const item = newLenientTierWindow("code-517", "name-125");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
