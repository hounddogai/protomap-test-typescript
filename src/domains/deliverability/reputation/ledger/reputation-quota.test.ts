import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationQuota } from "./reputation-quota.js";

test("ReputationQuota starts in open", () => {
  const item = newReputationQuota("code-83", "name-634");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationQuota moves to resolved", () => {
  const item = newReputationQuota("code-83", "name-634");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ReputationQuota rejects moves from archived", () => {
  const item = newReputationQuota("code-83", "name-634");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
