import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointDigest } from "./touchpoint-digest.js";

test("TouchpointDigest starts in requested", () => {
  const item = newTouchpointDigest("code-469", "name-930");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointDigest moves to granted", () => {
  const item = newTouchpointDigest("code-469", "name-930");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TouchpointDigest rejects moves from expired", () => {
  const item = newTouchpointDigest("code-469", "name-930");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
