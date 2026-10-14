import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyComplaintPreference } from "./legacy-complaint-preference.js";

test("LegacyComplaintPreference starts in requested", () => {
  const item = newLegacyComplaintPreference("code-431", "title-300");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyComplaintPreference moves to revoked", () => {
  const item = newLegacyComplaintPreference("code-431", "title-300");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LegacyComplaintPreference rejects moves from expired", () => {
  const item = newLegacyComplaintPreference("code-431", "title-300");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
