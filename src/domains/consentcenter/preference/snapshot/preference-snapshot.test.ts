import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceSnapshot } from "./preference-snapshot.js";

test("PreferenceSnapshot starts in open", () => {
  const item = newPreferenceSnapshot("code-640", "label-261");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceSnapshot moves to reopened", () => {
  const item = newPreferenceSnapshot("code-640", "label-261");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PreferenceSnapshot rejects moves from archived", () => {
  const item = newPreferenceSnapshot("code-640", "label-261");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
