import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPathSlot } from "./primary-path-slot.js";

test("PrimaryPathSlot starts in draft", () => {
  const item = newPrimaryPathSlot("code-731", "name-116");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPathSlot moves to active", () => {
  const item = newPrimaryPathSlot("code-731", "name-116");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryPathSlot rejects moves from closed", () => {
  const item = newPrimaryPathSlot("code-731", "name-116");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
