import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("StrictProofAdjustment starts in new", () => {
  const item = newStrictProofAdjustment("code-788", "title-279");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictProofAdjustment moves to queued", () => {
  const item = newStrictProofAdjustment("code-788", "title-279");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictProofAdjustment rejects moves from failed", () => {
  const item = newStrictProofAdjustment("code-788", "title-279");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
