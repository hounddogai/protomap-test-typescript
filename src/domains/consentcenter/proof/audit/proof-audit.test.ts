import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofAudit } from "./proof-audit.js";

test("ProofAudit starts in open", () => {
  const item = newProofAudit("code-320", "title-239");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofAudit moves to resolved", () => {
  const item = newProofAudit("code-320", "title-239");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ProofAudit rejects moves from archived", () => {
  const item = newProofAudit("code-320", "title-239");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
