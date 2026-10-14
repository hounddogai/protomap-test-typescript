import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBouncePreference } from "./global-bounce-preference.js";

test("GlobalBouncePreference starts in new", () => {
  const item = newGlobalBouncePreference("code-874", "label-329");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBouncePreference moves to running", () => {
  const item = newGlobalBouncePreference("code-874", "label-329");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("GlobalBouncePreference rejects moves from failed", () => {
  const item = newGlobalBouncePreference("code-874", "label-329");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
