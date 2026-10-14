import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionRecord } from "./deflection-record.js";

test("DeflectionRecord starts in draft", () => {
  const item = newDeflectionRecord("code-818", "name-198");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionRecord moves to pending", () => {
  const item = newDeflectionRecord("code-818", "name-198");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DeflectionRecord rejects moves from closed", () => {
  const item = newDeflectionRecord("code-818", "name-198");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
