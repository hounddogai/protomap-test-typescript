import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionGroup } from "./conversion-group.js";

test("ConversionGroup starts in draft", () => {
  const item = newConversionGroup("code-723", "label-777");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionGroup moves to suspended", () => {
  const item = newConversionGroup("code-723", "label-777");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ConversionGroup rejects moves from closed", () => {
  const item = newConversionGroup("code-723", "label-777");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
