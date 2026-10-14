import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionPolicy } from "./deflection-policy.js";

test("DeflectionPolicy starts in draft", () => {
  const item = newDeflectionPolicy("code-496", "name-352");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionPolicy moves to pending", () => {
  const item = newDeflectionPolicy("code-496", "name-352");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DeflectionPolicy rejects moves from closed", () => {
  const item = newDeflectionPolicy("code-496", "name-352");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
