import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientQueueDraft } from "./lenient-queue-draft.js";

test("LenientQueueDraft starts in created", () => {
  const item = newLenientQueueDraft("code-753", "label-72");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientQueueDraft moves to retired", () => {
  const item = newLenientQueueDraft("code-753", "label-72");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LenientQueueDraft rejects moves from retired", () => {
  const item = newLenientQueueDraft("code-753", "label-72");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
