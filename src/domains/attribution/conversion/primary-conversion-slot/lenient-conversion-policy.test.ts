import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientConversionPolicy } from "./lenient-conversion-policy.js";

test("LenientConversionPolicy starts in new", () => {
  const item = newLenientConversionPolicy("code-21", "name-465");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientConversionPolicy moves to queued", () => {
  const item = newLenientConversionPolicy("code-21", "name-465");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientConversionPolicy rejects moves from failed", () => {
  const item = newLenientConversionPolicy("code-21", "name-465");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
