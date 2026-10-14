import assert from "node:assert/strict";
import { test } from "node:test";
import { newBouncePlan } from "./bounce-plan.js";

test("BouncePlan starts in idle", () => {
  const item = newBouncePlan("code-472", "name-693");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BouncePlan moves to warming", () => {
  const item = newBouncePlan("code-472", "name-693");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BouncePlan rejects moves from stopped", () => {
  const item = newBouncePlan("code-472", "name-693");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
