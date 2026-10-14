import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaOverride } from "./sla-override.js";

test("SlaOverride starts in open", () => {
  const item = newSlaOverride("code-862", "name-482");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaOverride moves to reopened", () => {
  const item = newSlaOverride("code-862", "name-482");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaOverride rejects moves from archived", () => {
  const item = newSlaOverride("code-862", "name-482");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
