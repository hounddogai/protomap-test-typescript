import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInRollup } from "./double-opt-in-rollup.js";

test("DoubleOptInRollup starts in created", () => {
  const item = newDoubleOptInRollup("code-910", "label-71");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInRollup moves to published", () => {
  const item = newDoubleOptInRollup("code-910", "label-71");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DoubleOptInRollup rejects moves from retired", () => {
  const item = newDoubleOptInRollup("code-910", "label-71");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
