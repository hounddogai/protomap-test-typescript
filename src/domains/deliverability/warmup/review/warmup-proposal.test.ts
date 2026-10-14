import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupProposal } from "./warmup-proposal.js";

test("WarmupProposal starts in requested", () => {
  const item = newWarmupProposal("code-210", "label-146");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupProposal moves to revoked", () => {
  const item = newWarmupProposal("code-210", "label-146");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("WarmupProposal rejects moves from expired", () => {
  const item = newWarmupProposal("code-210", "label-146");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
