import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionEntry } from "./conversion-entry.js";

test("ConversionEntry starts in open", () => {
  const item = newConversionEntry("code-120", "title-786");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionEntry moves to in review", () => {
  const item = newConversionEntry("code-120", "title-786");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ConversionEntry rejects moves from archived", () => {
  const item = newConversionEntry("code-120", "title-786");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
