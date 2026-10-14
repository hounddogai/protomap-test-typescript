import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueProfile } from "./queue-profile.js";

test("QueueProfile starts in created", () => {
  const item = newQueueProfile("code-855", "title-526");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueProfile moves to published", () => {
  const item = newQueueProfile("code-855", "title-526");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("QueueProfile rejects moves from retired", () => {
  const item = newQueueProfile("code-855", "title-526");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
