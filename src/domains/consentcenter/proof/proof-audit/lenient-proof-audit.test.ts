import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientProofAudit } from "./lenient-proof-audit.js";

test("LenientProofAudit starts in idle", () => {
  const item = newLenientProofAudit("code-337", "title-790");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientProofAudit moves to warming", () => {
  const item = newLenientProofAudit("code-337", "title-790");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientProofAudit rejects moves from stopped", () => {
  const item = newLenientProofAudit("code-337", "title-790");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
