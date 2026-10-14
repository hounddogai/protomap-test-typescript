import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictProofEntry } from "./strict-proof-entry.js";

test("StrictProofEntry starts in new", () => {
  const item = newStrictProofEntry("code-243", "name-366");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictProofEntry moves to queued", () => {
  const item = newStrictProofEntry("code-243", "name-366");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictProofEntry rejects moves from failed", () => {
  const item = newStrictProofEntry("code-243", "name-366");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
