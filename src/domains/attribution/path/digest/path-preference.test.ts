import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathPreference } from "./path-preference.js";

test("PathPreference starts in proposed", () => {
  const item = newPathPreference("code-983", "title-620");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathPreference moves to withdrawn", () => {
  const item = newPathPreference("code-983", "title-620");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PathPreference rejects moves from withdrawn", () => {
  const item = newPathPreference("code-983", "title-620");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
