import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBadgeNotice } from "./legacy-badge-notice.js";

test("LegacyBadgeNotice starts in proposed", () => {
  const item = newLegacyBadgeNotice("code-490", "label-890");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBadgeNotice moves to rejected", () => {
  const item = newLegacyBadgeNotice("code-490", "label-890");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacyBadgeNotice rejects moves from withdrawn", () => {
  const item = newLegacyBadgeNotice("code-490", "label-890");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
