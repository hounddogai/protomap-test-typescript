import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutDraft } from "./opt-out-draft.js";

test("OptOutDraft starts in requested", () => {
  const item = newOptOutDraft("code-185", "label-655");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutDraft moves to expired", () => {
  const item = newOptOutDraft("code-185", "label-655");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("OptOutDraft rejects moves from expired", () => {
  const item = newOptOutDraft("code-185", "label-655");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
