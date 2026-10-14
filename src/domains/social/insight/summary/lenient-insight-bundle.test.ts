import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientInsightBundle } from "./lenient-insight-bundle.js";

test("LenientInsightBundle starts in planned", () => {
  const item = newLenientInsightBundle("code-553", "name-610");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientInsightBundle moves to scheduled", () => {
  const item = newLenientInsightBundle("code-553", "name-610");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientInsightBundle rejects moves from cancelled", () => {
  const item = newLenientInsightBundle("code-553", "name-610");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
