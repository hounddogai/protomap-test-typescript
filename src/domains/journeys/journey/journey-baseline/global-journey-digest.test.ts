import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalJourneyDigest } from "./global-journey-digest.js";

test("GlobalJourneyDigest starts in requested", () => {
  const item = newGlobalJourneyDigest("code-936", "label-305");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalJourneyDigest moves to granted", () => {
  const item = newGlobalJourneyDigest("code-936", "label-305");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalJourneyDigest rejects moves from expired", () => {
  const item = newGlobalJourneyDigest("code-936", "label-305");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
