import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceCycle } from "./bounce-cycle.js";

test("BounceCycle starts in idle", () => {
  const item = newBounceCycle("code-115", "label-180");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceCycle moves to draining", () => {
  const item = newBounceCycle("code-115", "label-180");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BounceCycle rejects moves from stopped", () => {
  const item = newBounceCycle("code-115", "label-180");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
