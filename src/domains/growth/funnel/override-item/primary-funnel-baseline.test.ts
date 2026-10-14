import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

test("PrimaryFunnelBaseline starts in open", () => {
  const item = newPrimaryFunnelBaseline("code-422", "name-310");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFunnelBaseline moves to archived", () => {
  const item = newPrimaryFunnelBaseline("code-422", "name-310");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PrimaryFunnelBaseline rejects moves from archived", () => {
  const item = newPrimaryFunnelBaseline("code-422", "name-310");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
