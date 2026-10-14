import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBounceRecord } from "./pending-bounce-record.js";

test("PendingBounceRecord starts in proposed", () => {
  const item = newPendingBounceRecord("code-730", "title-849");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBounceRecord moves to approved", () => {
  const item = newPendingBounceRecord("code-730", "title-849");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingBounceRecord rejects moves from withdrawn", () => {
  const item = newPendingBounceRecord("code-730", "title-849");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
