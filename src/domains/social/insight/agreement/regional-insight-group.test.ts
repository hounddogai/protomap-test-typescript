import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalInsightGroup } from "./regional-insight-group.js";

test("RegionalInsightGroup starts in requested", () => {
  const item = newRegionalInsightGroup("code-779", "label-134");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalInsightGroup moves to revoked", () => {
  const item = newRegionalInsightGroup("code-779", "label-134");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RegionalInsightGroup rejects moves from expired", () => {
  const item = newRegionalInsightGroup("code-779", "label-134");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
