import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("ManualPreferenceBaseline starts in new", () => {
  const item = newManualPreferenceBaseline("code-445", "title-138");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPreferenceBaseline moves to running", () => {
  const item = newManualPreferenceBaseline("code-445", "title-138");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ManualPreferenceBaseline rejects moves from failed", () => {
  const item = newManualPreferenceBaseline("code-445", "title-138");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
