import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualConversionPolicy } from "./manual-conversion-policy.js";

test("ManualConversionPolicy starts in created", () => {
  const item = newManualConversionPolicy("code-206", "label-491");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualConversionPolicy moves to published", () => {
  const item = newManualConversionPolicy("code-206", "label-491");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualConversionPolicy rejects moves from retired", () => {
  const item = newManualConversionPolicy("code-206", "label-491");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
