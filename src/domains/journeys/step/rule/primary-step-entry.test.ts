import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryStepEntry } from "./primary-step-entry.js";

test("PrimaryStepEntry starts in proposed", () => {
  const item = newPrimaryStepEntry("code-239", "name-112");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryStepEntry moves to approved", () => {
  const item = newPrimaryStepEntry("code-239", "name-112");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryStepEntry rejects moves from withdrawn", () => {
  const item = newPrimaryStepEntry("code-239", "name-112");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
