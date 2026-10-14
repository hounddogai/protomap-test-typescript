import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("SeasonalDomainAudit starts in new", () => {
  const item = newSeasonalDomainAudit("code-258", "title-312");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainAudit moves to queued", () => {
  const item = newSeasonalDomainAudit("code-258", "title-312");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalDomainAudit rejects moves from failed", () => {
  const item = newSeasonalDomainAudit("code-258", "title-312");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
