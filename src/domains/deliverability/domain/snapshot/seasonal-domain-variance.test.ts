import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainVariance } from "./seasonal-domain-variance.js";

test("SeasonalDomainVariance starts in open", () => {
  const item = newSeasonalDomainVariance("code-69", "name-877");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainVariance moves to resolved", () => {
  const item = newSeasonalDomainVariance("code-69", "name-877");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SeasonalDomainVariance rejects moves from archived", () => {
  const item = newSeasonalDomainVariance("code-69", "name-877");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
