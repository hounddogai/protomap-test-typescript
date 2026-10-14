import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationEntry } from "./reputation-entry.js";

test("ReputationEntry starts in new", () => {
  const item = newReputationEntry("code-901", "label-279");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationEntry moves to queued", () => {
  const item = newReputationEntry("code-901", "label-279");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ReputationEntry rejects moves from failed", () => {
  const item = newReputationEntry("code-901", "label-279");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
