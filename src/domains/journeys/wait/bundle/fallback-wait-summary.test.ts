import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWaitSummary } from "./fallback-wait-summary.js";

test("FallbackWaitSummary starts in proposed", () => {
  const item = newFallbackWaitSummary("code-369", "title-286");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWaitSummary moves to approved", () => {
  const item = newFallbackWaitSummary("code-369", "title-286");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackWaitSummary rejects moves from withdrawn", () => {
  const item = newFallbackWaitSummary("code-369", "title-286");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
