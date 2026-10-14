import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyPolicy } from "./frequency-policy.js";

test("FrequencyPolicy starts in open", () => {
  const item = newFrequencyPolicy("code-261", "title-530");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyPolicy moves to in review", () => {
  const item = newFrequencyPolicy("code-261", "title-530");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FrequencyPolicy rejects moves from archived", () => {
  const item = newFrequencyPolicy("code-261", "title-530");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
