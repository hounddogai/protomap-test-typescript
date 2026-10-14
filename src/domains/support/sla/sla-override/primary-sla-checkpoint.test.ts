import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaCheckpoint } from "./primary-sla-checkpoint.js";

test("PrimarySlaCheckpoint starts in draft", () => {
  const item = newPrimarySlaCheckpoint("code-695", "title-585");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaCheckpoint moves to active", () => {
  const item = newPrimarySlaCheckpoint("code-695", "title-585");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimarySlaCheckpoint rejects moves from closed", () => {
  const item = newPrimarySlaCheckpoint("code-695", "title-585");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
