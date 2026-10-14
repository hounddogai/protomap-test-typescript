import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientComplaintVariance } from "./lenient-complaint-variance.js";

test("LenientComplaintVariance starts in requested", () => {
  const item = newLenientComplaintVariance("code-564", "title-394");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientComplaintVariance moves to revoked", () => {
  const item = newLenientComplaintVariance("code-564", "title-394");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LenientComplaintVariance rejects moves from expired", () => {
  const item = newLenientComplaintVariance("code-564", "title-394");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
