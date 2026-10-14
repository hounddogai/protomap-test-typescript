import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWaitWindow } from "./capped-wait-window.js";

test("CappedWaitWindow starts in open", () => {
  const item = newCappedWaitWindow("code-803", "name-19");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWaitWindow moves to in review", () => {
  const item = newCappedWaitWindow("code-803", "name-19");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedWaitWindow rejects moves from archived", () => {
  const item = newCappedWaitWindow("code-803", "name-19");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
