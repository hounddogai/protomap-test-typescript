import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingProofAgreement } from "./pending-proof-agreement.js";

test("PendingProofAgreement starts in created", () => {
  const item = newPendingProofAgreement("code-565", "name-400");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingProofAgreement moves to published", () => {
  const item = newPendingProofAgreement("code-565", "name-400");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingProofAgreement rejects moves from retired", () => {
  const item = newPendingProofAgreement("code-565", "name-400");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
