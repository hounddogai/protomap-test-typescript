import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalModelException } from "./global-model-exception.js";

test("GlobalModelException starts in proposed", () => {
  const item = newGlobalModelException("code-283", "title-101");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalModelException moves to approved", () => {
  const item = newGlobalModelException("code-283", "title-101");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalModelException rejects moves from withdrawn", () => {
  const item = newGlobalModelException("code-283", "title-101");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
