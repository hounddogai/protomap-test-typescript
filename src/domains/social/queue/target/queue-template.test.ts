import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueTemplate } from "./queue-template.js";

test("QueueTemplate starts in created", () => {
  const item = newQueueTemplate("code-11", "title-734");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueTemplate moves to published", () => {
  const item = newQueueTemplate("code-11", "title-734");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("QueueTemplate rejects moves from retired", () => {
  const item = newQueueTemplate("code-11", "title-734");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
