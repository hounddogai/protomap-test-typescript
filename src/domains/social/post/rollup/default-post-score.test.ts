import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPostScore } from "./default-post-score.js";

test("DefaultPostScore starts in planned", () => {
  const item = newDefaultPostScore("code-962", "name-316");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPostScore moves to completed", () => {
  const item = newDefaultPostScore("code-962", "name-316");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DefaultPostScore rejects moves from cancelled", () => {
  const item = newDefaultPostScore("code-962", "name-316");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
