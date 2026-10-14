import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutWindow } from "./opt-out-window.js";

test("OptOutWindow starts in draft", () => {
  const item = newOptOutWindow("code-579", "title-650");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutWindow moves to suspended", () => {
  const item = newOptOutWindow("code-579", "title-650");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("OptOutWindow rejects moves from closed", () => {
  const item = newOptOutWindow("code-579", "title-650");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
