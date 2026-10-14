import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPayoutRecord } from "./primary-payout-record.js";

test("PrimaryPayoutRecord starts in draft", () => {
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPayoutRecord moves to pending", () => {
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryPayoutRecord rejects moves from closed", () => {
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
