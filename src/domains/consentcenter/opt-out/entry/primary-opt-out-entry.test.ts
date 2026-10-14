import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryOptOutEntry } from "./primary-opt-out-entry.js";

test("PrimaryOptOutEntry starts in draft", () => {
  const item = newPrimaryOptOutEntry("code-797", "label-994");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryOptOutEntry moves to suspended", () => {
  const item = newPrimaryOptOutEntry("code-797", "label-994");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PrimaryOptOutEntry rejects moves from closed", () => {
  const item = newPrimaryOptOutEntry("code-797", "label-994");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
