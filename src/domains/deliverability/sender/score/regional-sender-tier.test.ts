import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderTier } from "./regional-sender-tier.js";

test("RegionalSenderTier starts in draft", () => {
  const item = newRegionalSenderTier("code-556", "label-659");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderTier moves to pending", () => {
  const item = newRegionalSenderTier("code-556", "label-659");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalSenderTier rejects moves from closed", () => {
  const item = newRegionalSenderTier("code-556", "label-659");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
