import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("LegacyComplaintDraft starts in requested", () => {
  const item = newLegacyComplaintDraft("code-925", "title-56");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyComplaintDraft moves to expired", () => {
  const item = newLegacyComplaintDraft("code-925", "title-56");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LegacyComplaintDraft rejects moves from expired", () => {
  const item = newLegacyComplaintDraft("code-925", "title-56");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
