import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPathPreference } from "./lenient-path-preference.js";

test("LenientPathPreference starts in new", () => {
  const item = newLenientPathPreference("code-760", "name-537");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPathPreference moves to queued", () => {
  const item = newLenientPathPreference("code-760", "name-537");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientPathPreference rejects moves from failed", () => {
  const item = newLenientPathPreference("code-760", "name-537");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
