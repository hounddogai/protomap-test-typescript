import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSenderQuota } from "./capped-sender-quota.js";

test("CappedSenderQuota starts in created", () => {
  const item = newCappedSenderQuota("code-761", "title-857");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSenderQuota moves to validated", () => {
  const item = newCappedSenderQuota("code-761", "title-857");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedSenderQuota rejects moves from retired", () => {
  const item = newCappedSenderQuota("code-761", "title-857");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
