import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreativeRollup } from "./strict-creative-rollup.js";

test("StrictCreativeRollup starts in planned", () => {
  const item = newStrictCreativeRollup("code-861", "label-44");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreativeRollup moves to completed", () => {
  const item = newStrictCreativeRollup("code-861", "label-44");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StrictCreativeRollup rejects moves from cancelled", () => {
  const item = newStrictCreativeRollup("code-861", "label-44");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
