import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainAgreement } from "./seasonal-domain-agreement.js";

test("SeasonalDomainAgreement starts in draft", () => {
  const item = newSeasonalDomainAgreement("code-141", "title-555");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainAgreement moves to suspended", () => {
  const item = newSeasonalDomainAgreement("code-141", "title-555");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalDomainAgreement rejects moves from closed", () => {
  const item = newSeasonalDomainAgreement("code-141", "title-555");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
