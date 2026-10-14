import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofMapping } from "./proof-mapping.js";

test("ProofMapping starts in proposed", () => {
  const item = newProofMapping("code-360", "label-755");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofMapping moves to approved", () => {
  const item = newProofMapping("code-360", "label-755");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ProofMapping rejects moves from withdrawn", () => {
  const item = newProofMapping("code-360", "label-755");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
