import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("LegacyCsatQuota starts in proposed", () => {
  const item = newLegacyCsatQuota("code-835", "label-509");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCsatQuota moves to approved", () => {
  const item = newLegacyCsatQuota("code-835", "label-509");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyCsatQuota rejects moves from withdrawn", () => {
  const item = newLegacyCsatQuota("code-835", "label-509");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
