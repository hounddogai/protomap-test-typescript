import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreativePlan } from "./global-creative-plan.js";

test("GlobalCreativePlan starts in proposed", () => {
  const item = newGlobalCreativePlan("code-454", "label-818");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreativePlan moves to rejected", () => {
  const item = newGlobalCreativePlan("code-454", "label-818");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("GlobalCreativePlan rejects moves from withdrawn", () => {
  const item = newGlobalCreativePlan("code-454", "label-818");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
