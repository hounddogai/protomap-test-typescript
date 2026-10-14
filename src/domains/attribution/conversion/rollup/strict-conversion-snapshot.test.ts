import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictConversionSnapshot } from "./strict-conversion-snapshot.js";

test("StrictConversionSnapshot starts in draft", () => {
  const item = newStrictConversionSnapshot("code-632", "label-189");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictConversionSnapshot moves to pending", () => {
  const item = newStrictConversionSnapshot("code-632", "label-189");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictConversionSnapshot rejects moves from closed", () => {
  const item = newStrictConversionSnapshot("code-632", "label-189");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
