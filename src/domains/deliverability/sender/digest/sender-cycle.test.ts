import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderCycle } from "./sender-cycle.js";

test("SenderCycle starts in draft", () => {
  const item = newSenderCycle("code-243", "name-162");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderCycle moves to pending", () => {
  const item = newSenderCycle("code-243", "name-162");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SenderCycle rejects moves from closed", () => {
  const item = newSenderCycle("code-243", "name-162");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
