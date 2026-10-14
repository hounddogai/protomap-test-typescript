import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

test("ScheduledConversionRollup starts in created", () => {
  const item = newScheduledConversionRollup("code-520", "name-669");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledConversionRollup moves to validated", () => {
  const item = newScheduledConversionRollup("code-520", "name-669");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledConversionRollup rejects moves from retired", () => {
  const item = newScheduledConversionRollup("code-520", "name-669");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
