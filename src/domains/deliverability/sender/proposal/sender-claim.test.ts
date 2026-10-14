import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderClaim } from "./sender-claim.js";

test("SenderClaim starts in draft", () => {
  const item = newSenderClaim("code-295", "title-624");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderClaim moves to suspended", () => {
  const item = newSenderClaim("code-295", "title-624");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SenderClaim rejects moves from closed", () => {
  const item = newSenderClaim("code-295", "title-624");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
