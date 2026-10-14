import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationPreference } from "./activation-preference.js";

test("ActivationPreference starts in draft", () => {
  const item = newActivationPreference("code-575", "title-310");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationPreference moves to suspended", () => {
  const item = newActivationPreference("code-575", "title-310");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ActivationPreference rejects moves from closed", () => {
  const item = newActivationPreference("code-575", "title-310");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
