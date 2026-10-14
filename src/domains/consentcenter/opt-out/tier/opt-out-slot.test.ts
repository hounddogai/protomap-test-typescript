import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutSlot } from "./opt-out-slot.js";

test("OptOutSlot starts in draft", () => {
  const item = newOptOutSlot("code-546", "title-997");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutSlot moves to active", () => {
  const item = newOptOutSlot("code-546", "title-997");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("OptOutSlot rejects moves from closed", () => {
  const item = newOptOutSlot("code-546", "title-997");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
