import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyReputationTarget } from "./legacy-reputation-target.js";

test("LegacyReputationTarget starts in requested", () => {
  const item = newLegacyReputationTarget("code-211", "title-117");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyReputationTarget moves to granted", () => {
  const item = newLegacyReputationTarget("code-211", "title-117");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyReputationTarget rejects moves from expired", () => {
  const item = newLegacyReputationTarget("code-211", "title-117");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
