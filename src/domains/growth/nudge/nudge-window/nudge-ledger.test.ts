import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeLedger } from "./nudge-ledger.js";

test("NudgeLedger starts in new", () => {
  const item = newNudgeLedger("code-738", "title-46");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeLedger moves to queued", () => {
  const item = newNudgeLedger("code-738", "title-46");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("NudgeLedger rejects moves from failed", () => {
  const item = newNudgeLedger("code-738", "title-46");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
