import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitMapping } from "./wait-mapping.js";

test("WaitMapping starts in open", () => {
  const item = newWaitMapping("code-243", "name-969");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitMapping moves to in review", () => {
  const item = newWaitMapping("code-243", "name-969");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WaitMapping rejects moves from archived", () => {
  const item = newWaitMapping("code-243", "name-969");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
