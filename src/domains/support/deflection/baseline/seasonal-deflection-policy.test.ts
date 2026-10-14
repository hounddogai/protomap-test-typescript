import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

test("SeasonalDeflectionPolicy starts in requested", () => {
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDeflectionPolicy moves to revoked", () => {
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("SeasonalDeflectionPolicy rejects moves from expired", () => {
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
