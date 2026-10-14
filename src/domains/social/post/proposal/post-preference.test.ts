import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostPreference } from "./post-preference.js";

test("PostPreference starts in proposed", () => {
  const item = newPostPreference("code-126", "name-810");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostPreference moves to rejected", () => {
  const item = newPostPreference("code-126", "name-810");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PostPreference rejects moves from withdrawn", () => {
  const item = newPostPreference("code-126", "name-810");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
