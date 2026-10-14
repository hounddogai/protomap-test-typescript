import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

test("LegacyComplaintVariance starts in new", () => {
  const item = newLegacyComplaintVariance("code-603", "title-178");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyComplaintVariance moves to queued", () => {
  const item = newLegacyComplaintVariance("code-603", "title-178");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyComplaintVariance rejects moves from failed", () => {
  const item = newLegacyComplaintVariance("code-603", "title-178");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
