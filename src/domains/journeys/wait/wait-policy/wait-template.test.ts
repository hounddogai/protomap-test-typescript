import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitTemplate } from "./wait-template.js";

test("WaitTemplate starts in draft", () => {
  const item = newWaitTemplate("code-404", "title-583");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitTemplate moves to active", () => {
  const item = newWaitTemplate("code-404", "title-583");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WaitTemplate rejects moves from closed", () => {
  const item = newWaitTemplate("code-404", "title-583");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
