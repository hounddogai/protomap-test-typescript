import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionTarget } from "./conversion-target.js";

test("ConversionTarget starts in idle", () => {
  const item = newConversionTarget("code-471", "name-285");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionTarget moves to warming", () => {
  const item = newConversionTarget("code-471", "name-285");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ConversionTarget rejects moves from stopped", () => {
  const item = newConversionTarget("code-471", "name-285");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
