import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSenderMapping } from "./tiered-sender-mapping.js";

test("TieredSenderMapping starts in new", () => {
  const item = newTieredSenderMapping("code-183", "name-524");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSenderMapping moves to failed", () => {
  const item = newTieredSenderMapping("code-183", "name-524");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TieredSenderMapping rejects moves from failed", () => {
  const item = newTieredSenderMapping("code-183", "name-524");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
