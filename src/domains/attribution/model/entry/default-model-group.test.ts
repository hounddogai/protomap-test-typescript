import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultModelGroup } from "./default-model-group.js";

test("DefaultModelGroup starts in requested", () => {
  const item = newDefaultModelGroup("code-966", "title-93");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultModelGroup moves to revoked", () => {
  const item = newDefaultModelGroup("code-966", "title-93");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DefaultModelGroup rejects moves from expired", () => {
  const item = newDefaultModelGroup("code-966", "title-93");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
