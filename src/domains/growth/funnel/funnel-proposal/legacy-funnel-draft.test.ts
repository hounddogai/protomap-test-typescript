import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFunnelDraft } from "./legacy-funnel-draft.js";

test("LegacyFunnelDraft starts in draft", () => {
  const item = newLegacyFunnelDraft("code-832", "label-384");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFunnelDraft moves to suspended", () => {
  const item = newLegacyFunnelDraft("code-832", "label-384");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LegacyFunnelDraft rejects moves from closed", () => {
  const item = newLegacyFunnelDraft("code-832", "label-384");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
