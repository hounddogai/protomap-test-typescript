import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedConversionPolicy } from "./capped-conversion-policy.js";

test("CappedConversionPolicy starts in planned", () => {
  const item = newCappedConversionPolicy("code-707", "name-897");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedConversionPolicy moves to in progress", () => {
  const item = newCappedConversionPolicy("code-707", "name-897");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedConversionPolicy rejects moves from cancelled", () => {
  const item = newCappedConversionPolicy("code-707", "name-897");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
