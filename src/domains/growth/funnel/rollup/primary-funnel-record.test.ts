import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFunnelRecord } from "./primary-funnel-record.js";

test("PrimaryFunnelRecord starts in draft", () => {
  const item = newPrimaryFunnelRecord("code-72", "label-165");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFunnelRecord moves to suspended", () => {
  const item = newPrimaryFunnelRecord("code-72", "label-165");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PrimaryFunnelRecord rejects moves from closed", () => {
  const item = newPrimaryFunnelRecord("code-72", "label-165");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
