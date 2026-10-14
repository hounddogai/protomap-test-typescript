import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBadgeProfile } from "./global-badge-profile.js";

test("GlobalBadgeProfile starts in created", () => {
  const item = newGlobalBadgeProfile("code-886", "name-809");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBadgeProfile moves to published", () => {
  const item = newGlobalBadgeProfile("code-886", "name-809");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("GlobalBadgeProfile rejects moves from retired", () => {
  const item = newGlobalBadgeProfile("code-886", "name-809");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
