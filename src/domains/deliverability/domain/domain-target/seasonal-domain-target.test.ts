import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainTarget } from "./seasonal-domain-target.js";

test("SeasonalDomainTarget starts in draft", () => {
  const item = newSeasonalDomainTarget("code-875", "title-565");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainTarget moves to suspended", () => {
  const item = newSeasonalDomainTarget("code-875", "title-565");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalDomainTarget rejects moves from closed", () => {
  const item = newSeasonalDomainTarget("code-875", "title-565");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
