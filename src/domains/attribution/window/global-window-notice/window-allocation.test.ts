import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowAllocation } from "./window-allocation.js";

test("WindowAllocation starts in open", () => {
  const item = newWindowAllocation("code-751", "name-994");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowAllocation moves to archived", () => {
  const item = newWindowAllocation("code-751", "name-994");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("WindowAllocation rejects moves from archived", () => {
  const item = newWindowAllocation("code-751", "name-994");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
