import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelPreference } from "./batched-funnel-preference.js";

test("BatchedFunnelPreference starts in created", () => {
  const item = newBatchedFunnelPreference("code-255", "title-473");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelPreference moves to validated", () => {
  const item = newBatchedFunnelPreference("code-255", "title-473");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedFunnelPreference rejects moves from retired", () => {
  const item = newBatchedFunnelPreference("code-255", "title-473");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
