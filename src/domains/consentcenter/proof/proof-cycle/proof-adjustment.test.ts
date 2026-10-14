import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofAdjustment } from "./proof-adjustment.js";

test("ProofAdjustment starts in new", () => {
  const item = newProofAdjustment("code-603", "title-264");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofAdjustment moves to queued", () => {
  const item = newProofAdjustment("code-603", "title-264");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ProofAdjustment rejects moves from failed", () => {
  const item = newProofAdjustment("code-603", "title-264");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
