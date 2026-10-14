import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceRequest } from "./preference-request.js";

test("PreferenceRequest starts in draft", () => {
  const item = newPreferenceRequest("code-346", "name-945");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceRequest moves to suspended", () => {
  const item = newPreferenceRequest("code-346", "name-945");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PreferenceRequest rejects moves from closed", () => {
  const item = newPreferenceRequest("code-346", "name-945");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
