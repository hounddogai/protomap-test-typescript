import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceTemplate } from "./preference-template.js";

test("PreferenceTemplate starts in proposed", () => {
  const item = newPreferenceTemplate("code-682", "label-248");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceTemplate moves to rejected", () => {
  const item = newPreferenceTemplate("code-682", "label-248");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PreferenceTemplate rejects moves from withdrawn", () => {
  const item = newPreferenceTemplate("code-682", "label-248");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
