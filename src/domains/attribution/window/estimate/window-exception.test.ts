import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowException } from "./window-exception.js";

test("WindowException starts in requested", () => {
  const item = newWindowException("code-938", "name-561");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowException moves to granted", () => {
  const item = newWindowException("code-938", "name-561");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WindowException rejects moves from expired", () => {
  const item = newWindowException("code-938", "name-561");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
