import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionOverride } from "./conversion-override.js";

test("ConversionOverride starts in planned", () => {
  const item = newConversionOverride("code-965", "title-902");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionOverride moves to in progress", () => {
  const item = newConversionOverride("code-965", "title-902");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ConversionOverride rejects moves from cancelled", () => {
  const item = newConversionOverride("code-965", "title-902");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
