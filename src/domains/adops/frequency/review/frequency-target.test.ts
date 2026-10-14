import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyTarget } from "./frequency-target.js";

test("FrequencyTarget starts in new", () => {
  const item = newFrequencyTarget("code-970", "name-329");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyTarget moves to queued", () => {
  const item = newFrequencyTarget("code-970", "name-329");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FrequencyTarget rejects moves from failed", () => {
  const item = newFrequencyTarget("code-970", "name-329");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
