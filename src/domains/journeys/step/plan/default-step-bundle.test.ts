import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultStepBundle } from "./default-step-bundle.js";

test("DefaultStepBundle starts in draft", () => {
  const item = newDefaultStepBundle("code-84", "label-799");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultStepBundle moves to active", () => {
  const item = newDefaultStepBundle("code-84", "label-799");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DefaultStepBundle rejects moves from closed", () => {
  const item = newDefaultStepBundle("code-84", "label-799");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
