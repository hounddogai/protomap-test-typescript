import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMentionVariance } from "./capped-mention-variance.js";

test("CappedMentionVariance starts in planned", () => {
  const item = newCappedMentionVariance("code-731", "name-4");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMentionVariance moves to scheduled", () => {
  const item = newCappedMentionVariance("code-731", "name-4");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedMentionVariance rejects moves from cancelled", () => {
  const item = newCappedMentionVariance("code-731", "name-4");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
