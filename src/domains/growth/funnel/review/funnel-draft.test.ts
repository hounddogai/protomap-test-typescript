import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelDraft } from "./funnel-draft.js";

test("FunnelDraft starts in created", () => {
  const item = newFunnelDraft("code-170", "name-383");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelDraft moves to published", () => {
  const item = newFunnelDraft("code-170", "name-383");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FunnelDraft rejects moves from retired", () => {
  const item = newFunnelDraft("code-170", "name-383");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
