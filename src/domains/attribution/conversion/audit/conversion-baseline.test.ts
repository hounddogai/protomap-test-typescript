import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionBaseline } from "./conversion-baseline.js";

test("ConversionBaseline starts in idle", () => {
  const item = newConversionBaseline("code-667", "title-473");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionBaseline moves to warming", () => {
  const item = newConversionBaseline("code-667", "title-473");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ConversionBaseline rejects moves from stopped", () => {
  const item = newConversionBaseline("code-667", "title-473");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
