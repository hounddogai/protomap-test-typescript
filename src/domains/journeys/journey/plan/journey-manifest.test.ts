import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyManifest } from "./journey-manifest.js";

test("JourneyManifest starts in requested", () => {
  const item = newJourneyManifest("code-37", "name-959");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyManifest moves to expired", () => {
  const item = newJourneyManifest("code-37", "name-959");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("JourneyManifest rejects moves from expired", () => {
  const item = newJourneyManifest("code-37", "name-959");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
