import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

test("AdaptiveOptOutRecord starts in proposed", () => {
  const item = newAdaptiveOptOutRecord("code-888", "label-682");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveOptOutRecord moves to approved", () => {
  const item = newAdaptiveOptOutRecord("code-888", "label-682");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveOptOutRecord rejects moves from withdrawn", () => {
  const item = newAdaptiveOptOutRecord("code-888", "label-682");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
