import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSubscriptionPreference } from "./lenient-subscription-preference.js";

test("LenientSubscriptionPreference starts in created", () => {
  const item = newLenientSubscriptionPreference("code-753", "title-169");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSubscriptionPreference moves to published", () => {
  const item = newLenientSubscriptionPreference("code-753", "title-169");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientSubscriptionPreference rejects moves from retired", () => {
  const item = newLenientSubscriptionPreference("code-753", "title-169");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
