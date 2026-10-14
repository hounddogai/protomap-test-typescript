import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPreferenceVariance } from "./strict-preference-variance.js";

test("StrictPreferenceVariance starts in idle", () => {
  const item = newStrictPreferenceVariance("code-921", "title-804");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPreferenceVariance moves to warming", () => {
  const item = newStrictPreferenceVariance("code-921", "title-804");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictPreferenceVariance rejects moves from stopped", () => {
  const item = newStrictPreferenceVariance("code-921", "title-804");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
