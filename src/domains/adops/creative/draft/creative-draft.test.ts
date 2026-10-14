import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeDraft } from "./creative-draft.js";

test("CreativeDraft starts in requested", () => {
  const item = newCreativeDraft("code-339", "name-565");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeDraft moves to revoked", () => {
  const item = newCreativeDraft("code-339", "name-565");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CreativeDraft rejects moves from expired", () => {
  const item = newCreativeDraft("code-339", "name-565");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
