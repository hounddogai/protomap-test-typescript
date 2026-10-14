import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionRollup } from "./conversion-rollup.js";

test("ConversionRollup starts in planned", () => {
  const item = newConversionRollup("code-242", "label-980");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionRollup moves to scheduled", () => {
  const item = newConversionRollup("code-242", "label-980");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ConversionRollup rejects moves from cancelled", () => {
  const item = newConversionRollup("code-242", "label-980");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
