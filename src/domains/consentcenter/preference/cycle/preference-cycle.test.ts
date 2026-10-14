import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceCycle } from "./preference-cycle.js";

test("PreferenceCycle starts in draft", () => {
  const item = newPreferenceCycle("code-158", "name-211");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceCycle moves to pending", () => {
  const item = newPreferenceCycle("code-158", "name-211");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PreferenceCycle rejects moves from closed", () => {
  const item = newPreferenceCycle("code-158", "name-211");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
