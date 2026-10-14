import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgePreference } from "./badge-preference.js";

test("BadgePreference starts in created", () => {
  const item = newBadgePreference("code-573", "label-335");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgePreference moves to validated", () => {
  const item = newBadgePreference("code-573", "label-335");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BadgePreference rejects moves from retired", () => {
  const item = newBadgePreference("code-573", "label-335");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
