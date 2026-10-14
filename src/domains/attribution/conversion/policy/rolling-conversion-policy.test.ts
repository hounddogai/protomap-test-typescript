import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingConversionPolicy } from "./rolling-conversion-policy.js";

test("RollingConversionPolicy starts in draft", () => {
  const item = newRollingConversionPolicy("code-928", "title-326");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingConversionPolicy moves to closed", () => {
  const item = newRollingConversionPolicy("code-928", "title-326");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("RollingConversionPolicy rejects moves from closed", () => {
  const item = newRollingConversionPolicy("code-928", "title-326");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
