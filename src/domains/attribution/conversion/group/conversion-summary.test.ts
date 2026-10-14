import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionSummary } from "./conversion-summary.js";

test("ConversionSummary starts in new", () => {
  const item = newConversionSummary("code-609", "label-507");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionSummary moves to done", () => {
  const item = newConversionSummary("code-609", "label-507");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ConversionSummary rejects moves from failed", () => {
  const item = newConversionSummary("code-609", "label-507");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
