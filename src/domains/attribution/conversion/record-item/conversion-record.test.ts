import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionRecord } from "./conversion-record.js";

test("ConversionRecord starts in draft", () => {
  const item = newConversionRecord("code-409", "title-545");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionRecord moves to suspended", () => {
  const item = newConversionRecord("code-409", "title-545");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ConversionRecord rejects moves from closed", () => {
  const item = newConversionRecord("code-409", "title-545");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
