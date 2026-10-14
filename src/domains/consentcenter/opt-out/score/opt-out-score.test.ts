import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutScore } from "./opt-out-score.js";

test("OptOutScore starts in proposed", () => {
  const item = newOptOutScore("code-237", "name-316");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutScore moves to rejected", () => {
  const item = newOptOutScore("code-237", "name-316");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("OptOutScore rejects moves from withdrawn", () => {
  const item = newOptOutScore("code-237", "name-316");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
