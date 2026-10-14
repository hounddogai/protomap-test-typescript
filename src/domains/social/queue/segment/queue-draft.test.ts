import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueDraft } from "./queue-draft.js";

test("QueueDraft starts in open", () => {
  const item = newQueueDraft("code-763", "title-474");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueDraft moves to in review", () => {
  const item = newQueueDraft("code-763", "title-474");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("QueueDraft rejects moves from archived", () => {
  const item = newQueueDraft("code-763", "title-474");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
