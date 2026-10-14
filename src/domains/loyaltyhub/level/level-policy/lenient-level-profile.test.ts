import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLevelProfile } from "./lenient-level-profile.js";

test("LenientLevelProfile starts in new", () => {
  const item = newLenientLevelProfile("code-846", "name-875");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLevelProfile moves to done", () => {
  const item = newLenientLevelProfile("code-846", "name-875");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LenientLevelProfile rejects moves from failed", () => {
  const item = newLenientLevelProfile("code-846", "name-875");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
