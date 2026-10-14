import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeBatch } from "./nudge-batch.js";

test("NudgeBatch starts in new", () => {
  const item = newNudgeBatch("code-656", "label-647");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeBatch moves to queued", () => {
  const item = newNudgeBatch("code-656", "label-647");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("NudgeBatch rejects moves from failed", () => {
  const item = newNudgeBatch("code-656", "label-647");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
