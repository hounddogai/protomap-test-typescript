import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathDigest } from "./path-digest.js";

test("PathDigest starts in requested", () => {
  const item = newPathDigest("code-288", "name-712");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathDigest moves to granted", () => {
  const item = newPathDigest("code-288", "name-712");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PathDigest rejects moves from expired", () => {
  const item = newPathDigest("code-288", "name-712");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
