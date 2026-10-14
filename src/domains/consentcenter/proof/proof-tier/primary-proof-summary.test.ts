import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryProofSummary } from "./primary-proof-summary.js";

test("PrimaryProofSummary starts in new", () => {
  const item = newPrimaryProofSummary("code-463", "name-257");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryProofSummary moves to queued", () => {
  const item = newPrimaryProofSummary("code-463", "name-257");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PrimaryProofSummary rejects moves from failed", () => {
  const item = newPrimaryProofSummary("code-463", "name-257");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
