import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelEntry } from "./model-entry.js";

test("ModelEntry starts in created", () => {
  const item = newModelEntry("code-235", "title-966");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelEntry moves to retired", () => {
  const item = newModelEntry("code-235", "title-966");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ModelEntry rejects moves from retired", () => {
  const item = newModelEntry("code-235", "title-966");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
