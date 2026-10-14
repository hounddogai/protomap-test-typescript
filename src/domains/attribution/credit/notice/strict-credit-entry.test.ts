import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreditEntry } from "./strict-credit-entry.js";

test("StrictCreditEntry starts in idle", () => {
  const item = newStrictCreditEntry("code-458", "name-916");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreditEntry moves to draining", () => {
  const item = newStrictCreditEntry("code-458", "name-916");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("StrictCreditEntry rejects moves from stopped", () => {
  const item = newStrictCreditEntry("code-458", "name-916");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
