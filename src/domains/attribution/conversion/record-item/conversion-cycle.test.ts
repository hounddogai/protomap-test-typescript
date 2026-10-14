import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionCycle } from "./conversion-cycle.js";

test("ConversionCycle starts in new", () => {
  const item = newConversionCycle("code-477", "name-325");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionCycle moves to queued", () => {
  const item = newConversionCycle("code-477", "name-325");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ConversionCycle rejects moves from failed", () => {
  const item = newConversionCycle("code-477", "name-325");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
