import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreativeOverride } from "./legacy-creative-override.js";

test("LegacyCreativeOverride starts in requested", () => {
  const item = newLegacyCreativeOverride("code-488", "name-77");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreativeOverride moves to expired", () => {
  const item = newLegacyCreativeOverride("code-488", "name-77");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LegacyCreativeOverride rejects moves from expired", () => {
  const item = newLegacyCreativeOverride("code-488", "name-77");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
