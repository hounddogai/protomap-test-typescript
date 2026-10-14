import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutTemplate } from "./opt-out-template.js";

test("OptOutTemplate starts in draft", () => {
  const item = newOptOutTemplate("code-621", "title-985");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutTemplate moves to pending", () => {
  const item = newOptOutTemplate("code-621", "title-985");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("OptOutTemplate rejects moves from closed", () => {
  const item = newOptOutTemplate("code-621", "title-985");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
