import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTouchpointAudit } from "./regional-touchpoint-audit.js";

test("RegionalTouchpointAudit starts in draft", () => {
  const item = newRegionalTouchpointAudit("code-952", "title-607");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTouchpointAudit moves to suspended", () => {
  const item = newRegionalTouchpointAudit("code-952", "title-607");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RegionalTouchpointAudit rejects moves from closed", () => {
  const item = newRegionalTouchpointAudit("code-952", "title-607");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
