import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderRule } from "./sender-rule.js";

test("SenderRule starts in open", () => {
  const item = newSenderRule("code-798", "title-202");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderRule moves to reopened", () => {
  const item = newSenderRule("code-798", "title-202");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SenderRule rejects moves from archived", () => {
  const item = newSenderRule("code-798", "title-202");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
