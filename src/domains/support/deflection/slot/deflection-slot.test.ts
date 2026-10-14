import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionSlot } from "./deflection-slot.js";

test("DeflectionSlot starts in draft", () => {
  const item = newDeflectionSlot("code-281", "name-192");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionSlot moves to pending", () => {
  const item = newDeflectionSlot("code-281", "name-192");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DeflectionSlot rejects moves from closed", () => {
  const item = newDeflectionSlot("code-281", "name-192");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
