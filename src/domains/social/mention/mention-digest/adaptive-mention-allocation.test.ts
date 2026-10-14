import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

test("AdaptiveMentionAllocation starts in open", () => {
  const item = newAdaptiveMentionAllocation("code-852", "name-825");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMentionAllocation moves to archived", () => {
  const item = newAdaptiveMentionAllocation("code-852", "name-825");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("AdaptiveMentionAllocation rejects moves from archived", () => {
  const item = newAdaptiveMentionAllocation("code-852", "name-825");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
