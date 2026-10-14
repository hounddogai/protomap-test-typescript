import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPreferenceSnapshot } from "./regional-preference-snapshot.js";

test("RegionalPreferenceSnapshot starts in planned", () => {
  const item = newRegionalPreferenceSnapshot("code-574", "label-969");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPreferenceSnapshot moves to scheduled", () => {
  const item = newRegionalPreferenceSnapshot("code-574", "label-969");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalPreferenceSnapshot rejects moves from cancelled", () => {
  const item = newRegionalPreferenceSnapshot("code-574", "label-969");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
