import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveProofDraft } from "./adaptive-proof-draft.js";

test("AdaptiveProofDraft starts in draft", () => {
  const item = newAdaptiveProofDraft("code-766", "name-779");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveProofDraft moves to suspended", () => {
  const item = newAdaptiveProofDraft("code-766", "name-779");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("AdaptiveProofDraft rejects moves from closed", () => {
  const item = newAdaptiveProofDraft("code-766", "name-779");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
