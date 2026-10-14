import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

test("SeasonalDoubleOptInAudit starts in created", () => {
  const item = newSeasonalDoubleOptInAudit("code-522", "label-528");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDoubleOptInAudit moves to validated", () => {
  const item = newSeasonalDoubleOptInAudit("code-522", "label-528");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalDoubleOptInAudit rejects moves from retired", () => {
  const item = newSeasonalDoubleOptInAudit("code-522", "label-528");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
