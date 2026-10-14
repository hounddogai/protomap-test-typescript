import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSlaVariance } from "./seasonal-sla-variance.js";

test("SeasonalSlaVariance starts in requested", () => {
  const item = newSeasonalSlaVariance("code-942", "name-7");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSlaVariance moves to granted", () => {
  const item = newSeasonalSlaVariance("code-942", "name-7");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalSlaVariance rejects moves from expired", () => {
  const item = newSeasonalSlaVariance("code-942", "name-7");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
