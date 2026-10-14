import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("PrimaryConversionTarget starts in proposed", () => {
  const item = newPrimaryConversionTarget("code-18", "title-358");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionTarget moves to rejected", () => {
  const item = newPrimaryConversionTarget("code-18", "title-358");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryConversionTarget rejects moves from withdrawn", () => {
  const item = newPrimaryConversionTarget("code-18", "title-358");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
