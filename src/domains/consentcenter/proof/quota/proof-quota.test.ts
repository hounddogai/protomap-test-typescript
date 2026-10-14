import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofQuota } from "./proof-quota.js";

test("ProofQuota starts in open", () => {
  const item = newProofQuota("code-484", "name-544");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofQuota moves to resolved", () => {
  const item = newProofQuota("code-484", "name-544");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ProofQuota rejects moves from archived", () => {
  const item = newProofQuota("code-484", "name-544");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
