import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyGroup } from "./frequency-group.js";

test("FrequencyGroup starts in new", () => {
  const item = newFrequencyGroup("code-869", "label-883");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyGroup moves to queued", () => {
  const item = newFrequencyGroup("code-869", "label-883");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FrequencyGroup rejects moves from failed", () => {
  const item = newFrequencyGroup("code-869", "label-883");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
