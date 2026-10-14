import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLevelEntry } from "./manual-level-entry.js";

test("ManualLevelEntry starts in open", () => {
  const item = newManualLevelEntry("code-163", "label-508");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLevelEntry moves to in review", () => {
  const item = newManualLevelEntry("code-163", "label-508");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualLevelEntry rejects moves from archived", () => {
  const item = newManualLevelEntry("code-163", "label-508");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
