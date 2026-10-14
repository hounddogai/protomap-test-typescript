import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyCycle } from "./reply-cycle.js";

test("ReplyCycle starts in open", () => {
  const item = newReplyCycle("code-546", "name-608");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyCycle moves to resolved", () => {
  const item = newReplyCycle("code-546", "name-608");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ReplyCycle rejects moves from archived", () => {
  const item = newReplyCycle("code-546", "name-608");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
