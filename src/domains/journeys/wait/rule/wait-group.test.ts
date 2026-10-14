import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitGroup } from "./wait-group.js";

test("WaitGroup starts in draft", () => {
  const item = newWaitGroup("code-626", "title-128");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitGroup moves to active", () => {
  const item = newWaitGroup("code-626", "title-128");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WaitGroup rejects moves from closed", () => {
  const item = newWaitGroup("code-626", "title-128");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
