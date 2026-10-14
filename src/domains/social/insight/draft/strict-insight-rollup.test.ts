import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictInsightRollup } from "./strict-insight-rollup.js";

test("StrictInsightRollup starts in planned", () => {
  const item = newStrictInsightRollup("code-160", "label-233");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictInsightRollup moves to completed", () => {
  const item = newStrictInsightRollup("code-160", "label-233");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StrictInsightRollup rejects moves from cancelled", () => {
  const item = newStrictInsightRollup("code-160", "label-233");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
