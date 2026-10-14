import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedReplyLedger } from "./capped-reply-ledger.js";

test("CappedReplyLedger starts in created", () => {
  const item = newCappedReplyLedger("code-848", "title-172");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedReplyLedger moves to published", () => {
  const item = newCappedReplyLedger("code-848", "title-172");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CappedReplyLedger rejects moves from retired", () => {
  const item = newCappedReplyLedger("code-848", "title-172");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
