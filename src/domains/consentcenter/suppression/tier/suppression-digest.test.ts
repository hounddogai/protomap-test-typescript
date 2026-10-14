import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionDigest } from "./suppression-digest.js";

test("SuppressionDigest starts in created", () => {
  const item = newSuppressionDigest("code-117", "label-171");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionDigest moves to validated", () => {
  const item = newSuppressionDigest("code-117", "label-171");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SuppressionDigest rejects moves from retired", () => {
  const item = newSuppressionDigest("code-117", "label-171");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
