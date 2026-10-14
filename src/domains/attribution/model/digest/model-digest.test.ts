import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelDigest } from "./model-digest.js";

test("ModelDigest starts in created", () => {
  const item = newModelDigest("code-753", "name-292");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelDigest moves to validated", () => {
  const item = newModelDigest("code-753", "name-292");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ModelDigest rejects moves from retired", () => {
  const item = newModelDigest("code-753", "name-292");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
