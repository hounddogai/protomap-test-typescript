import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSlaPreference } from "./global-sla-preference.js";

test("GlobalSlaPreference starts in draft", () => {
  const item = newGlobalSlaPreference("code-149", "label-917");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSlaPreference moves to active", () => {
  const item = newGlobalSlaPreference("code-149", "label-917");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("GlobalSlaPreference rejects moves from closed", () => {
  const item = newGlobalSlaPreference("code-149", "label-917");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
