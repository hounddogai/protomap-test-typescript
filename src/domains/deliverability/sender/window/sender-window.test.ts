import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderWindow } from "./sender-window.js";

test("SenderWindow starts in proposed", () => {
  const item = newSenderWindow("code-690", "title-785");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderWindow moves to rejected", () => {
  const item = newSenderWindow("code-690", "title-785");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SenderWindow rejects moves from withdrawn", () => {
  const item = newSenderWindow("code-690", "title-785");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
