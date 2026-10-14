import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBadgeBaseline } from "./global-badge-baseline.js";

test("GlobalBadgeBaseline starts in requested", () => {
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBadgeBaseline moves to revoked", () => {
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("GlobalBadgeBaseline rejects moves from expired", () => {
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
