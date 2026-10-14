import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderQuota } from "./sender-quota.js";

test("SenderQuota starts in created", () => {
  const item = newSenderQuota("code-289", "label-810");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderQuota moves to validated", () => {
  const item = newSenderQuota("code-289", "label-810");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SenderQuota rejects moves from retired", () => {
  const item = newSenderQuota("code-289", "label-810");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
