import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyClaim } from "./frequency-claim.js";

test("FrequencyClaim starts in planned", () => {
  const item = newFrequencyClaim("code-216", "title-886");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyClaim moves to in progress", () => {
  const item = newFrequencyClaim("code-216", "title-886");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FrequencyClaim rejects moves from cancelled", () => {
  const item = newFrequencyClaim("code-216", "title-886");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
