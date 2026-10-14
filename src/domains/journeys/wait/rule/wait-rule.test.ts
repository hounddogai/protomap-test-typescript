import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitRule } from "./wait-rule.js";

test("WaitRule starts in draft", () => {
  const item = newWaitRule("code-707", "title-914");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitRule moves to closed", () => {
  const item = newWaitRule("code-707", "title-914");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("WaitRule rejects moves from closed", () => {
  const item = newWaitRule("code-707", "title-914");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
