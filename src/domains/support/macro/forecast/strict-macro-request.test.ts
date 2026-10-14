import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMacroRequest } from "./strict-macro-request.js";

test("StrictMacroRequest starts in open", () => {
  const item = newStrictMacroRequest("code-142", "title-249");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMacroRequest moves to archived", () => {
  const item = newStrictMacroRequest("code-142", "title-249");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("StrictMacroRequest rejects moves from archived", () => {
  const item = newStrictMacroRequest("code-142", "title-249");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
