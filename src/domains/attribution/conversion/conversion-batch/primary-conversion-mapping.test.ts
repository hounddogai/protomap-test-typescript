import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("PrimaryConversionMapping starts in idle", () => {
  const item = newPrimaryConversionMapping("code-616", "label-774");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionMapping moves to draining", () => {
  const item = newPrimaryConversionMapping("code-616", "label-774");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimaryConversionMapping rejects moves from stopped", () => {
  const item = newPrimaryConversionMapping("code-616", "label-774");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
