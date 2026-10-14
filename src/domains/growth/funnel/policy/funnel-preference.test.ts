import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelPreference } from "./funnel-preference.js";

test("FunnelPreference starts in proposed", () => {
  const item = newFunnelPreference("code-361", "name-932");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelPreference moves to approved", () => {
  const item = newFunnelPreference("code-361", "name-932");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FunnelPreference rejects moves from withdrawn", () => {
  const item = newFunnelPreference("code-361", "name-932");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
