import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSenderScore } from "./default-sender-score.js";

test("DefaultSenderScore starts in draft", () => {
  const item = newDefaultSenderScore("code-382", "title-126");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSenderScore moves to active", () => {
  const item = newDefaultSenderScore("code-382", "title-126");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DefaultSenderScore rejects moves from closed", () => {
  const item = newDefaultSenderScore("code-382", "title-126");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
