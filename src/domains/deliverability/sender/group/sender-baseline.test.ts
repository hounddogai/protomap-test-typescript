import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderBaseline } from "./sender-baseline.js";

test("SenderBaseline starts in proposed", () => {
  const item = newSenderBaseline("code-292", "title-69");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderBaseline moves to rejected", () => {
  const item = newSenderBaseline("code-292", "title-69");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SenderBaseline rejects moves from withdrawn", () => {
  const item = newSenderBaseline("code-292", "title-69");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
