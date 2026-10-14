import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathSlot } from "./path-slot.js";

test("PathSlot starts in created", () => {
  const item = newPathSlot("code-444", "name-457");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathSlot moves to validated", () => {
  const item = newPathSlot("code-444", "name-457");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PathSlot rejects moves from retired", () => {
  const item = newPathSlot("code-444", "name-457");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
