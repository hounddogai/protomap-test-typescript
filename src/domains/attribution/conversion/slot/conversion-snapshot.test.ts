import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionSnapshot } from "./conversion-snapshot.js";

test("ConversionSnapshot starts in draft", () => {
  const item = newConversionSnapshot("code-373", "name-373");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionSnapshot moves to pending", () => {
  const item = newConversionSnapshot("code-373", "name-373");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ConversionSnapshot rejects moves from closed", () => {
  const item = newConversionSnapshot("code-373", "name-373");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
