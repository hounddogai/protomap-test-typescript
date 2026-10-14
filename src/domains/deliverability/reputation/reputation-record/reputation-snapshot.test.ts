import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationSnapshot } from "./reputation-snapshot.js";

test("ReputationSnapshot starts in new", () => {
  const item = newReputationSnapshot("code-673", "title-83");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationSnapshot moves to running", () => {
  const item = newReputationSnapshot("code-673", "title-83");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ReputationSnapshot rejects moves from failed", () => {
  const item = newReputationSnapshot("code-673", "title-83");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
