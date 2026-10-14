import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSlaPreference } from "./default-sla-preference.js";

test("DefaultSlaPreference starts in proposed", () => {
  const item = newDefaultSlaPreference("code-72", "name-650");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSlaPreference moves to approved", () => {
  const item = newDefaultSlaPreference("code-72", "name-650");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultSlaPreference rejects moves from withdrawn", () => {
  const item = newDefaultSlaPreference("code-72", "name-650");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
