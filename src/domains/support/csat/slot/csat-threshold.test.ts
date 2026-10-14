import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatThreshold } from "./csat-threshold.js";

test("CsatThreshold starts in draft", () => {
  const item = newCsatThreshold("code-423", "name-284");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatThreshold moves to pending", () => {
  const item = newCsatThreshold("code-423", "name-284");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CsatThreshold rejects moves from closed", () => {
  const item = newCsatThreshold("code-423", "name-284");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
