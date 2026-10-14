import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyWindow } from "./frequency-window.js";

test("FrequencyWindow starts in proposed", () => {
  const item = newFrequencyWindow("code-413", "title-309");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyWindow moves to rejected", () => {
  const item = newFrequencyWindow("code-413", "title-309");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FrequencyWindow rejects moves from withdrawn", () => {
  const item = newFrequencyWindow("code-413", "title-309");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
