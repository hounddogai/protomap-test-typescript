import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderTarget } from "./sender-target.js";

test("SenderTarget starts in proposed", () => {
  const item = newSenderTarget("code-382", "label-307");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderTarget moves to rejected", () => {
  const item = newSenderTarget("code-382", "label-307");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SenderTarget rejects moves from withdrawn", () => {
  const item = newSenderTarget("code-382", "label-307");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
