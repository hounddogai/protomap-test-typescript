import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMentionRecord } from "./capped-mention-record.js";

test("CappedMentionRecord starts in planned", () => {
  const item = newCappedMentionRecord("code-130", "label-316");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMentionRecord moves to in progress", () => {
  const item = newCappedMentionRecord("code-130", "label-316");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedMentionRecord rejects moves from cancelled", () => {
  const item = newCappedMentionRecord("code-130", "label-316");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
