import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFunnelOverride } from "./legacy-funnel-override.js";

test("LegacyFunnelOverride starts in created", () => {
  const item = newLegacyFunnelOverride("code-319", "title-818");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFunnelOverride moves to published", () => {
  const item = newLegacyFunnelOverride("code-319", "title-818");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyFunnelOverride rejects moves from retired", () => {
  const item = newLegacyFunnelOverride("code-319", "title-818");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
