import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionRequest } from "./conversion-request.js";

test("ConversionRequest starts in draft", () => {
  const item = newConversionRequest("code-54", "label-332");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionRequest moves to active", () => {
  const item = newConversionRequest("code-54", "label-332");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ConversionRequest rejects moves from closed", () => {
  const item = newConversionRequest("code-54", "label-332");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
