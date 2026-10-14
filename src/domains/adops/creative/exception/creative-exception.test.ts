import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeException } from "./creative-exception.js";

test("CreativeException starts in planned", () => {
  const item = newCreativeException("code-919", "name-886");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeException moves to scheduled", () => {
  const item = newCreativeException("code-919", "name-886");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CreativeException rejects moves from cancelled", () => {
  const item = newCreativeException("code-919", "name-886");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
