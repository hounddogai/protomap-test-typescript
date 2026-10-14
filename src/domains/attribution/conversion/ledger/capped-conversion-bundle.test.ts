import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedConversionBundle } from "./capped-conversion-bundle.js";

test("CappedConversionBundle starts in proposed", () => {
  const item = newCappedConversionBundle("code-24", "label-562");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedConversionBundle moves to approved", () => {
  const item = newCappedConversionBundle("code-24", "label-562");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedConversionBundle rejects moves from withdrawn", () => {
  const item = newCappedConversionBundle("code-24", "label-562");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
