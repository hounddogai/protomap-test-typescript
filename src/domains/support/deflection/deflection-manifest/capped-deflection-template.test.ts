import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDeflectionTemplate } from "./capped-deflection-template.js";

test("CappedDeflectionTemplate starts in new", () => {
  const item = newCappedDeflectionTemplate("code-515", "name-678");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDeflectionTemplate moves to running", () => {
  const item = newCappedDeflectionTemplate("code-515", "name-678");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedDeflectionTemplate rejects moves from failed", () => {
  const item = newCappedDeflectionTemplate("code-515", "name-678");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
