import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSenderRule } from "./default-sender-rule.js";

test("DefaultSenderRule starts in created", () => {
  const item = newDefaultSenderRule("code-759", "name-487");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSenderRule moves to validated", () => {
  const item = newDefaultSenderRule("code-759", "name-487");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultSenderRule rejects moves from retired", () => {
  const item = newDefaultSenderRule("code-759", "name-487");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
