import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultDeflectionDigest } from "./default-deflection-digest.js";

test("DefaultDeflectionDigest starts in open", () => {
  const item = newDefaultDeflectionDigest("code-718", "name-799");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultDeflectionDigest moves to archived", () => {
  const item = newDefaultDeflectionDigest("code-718", "name-799");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DefaultDeflectionDigest rejects moves from archived", () => {
  const item = newDefaultDeflectionDigest("code-718", "name-799");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
