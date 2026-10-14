import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionException } from "./conversion-exception.js";

test("ConversionException starts in idle", () => {
  const item = newConversionException("code-213", "name-534");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionException moves to warming", () => {
  const item = newConversionException("code-213", "name-534");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ConversionException rejects moves from stopped", () => {
  const item = newConversionException("code-213", "name-534");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
