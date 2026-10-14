import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFunnelRequest } from "./lenient-funnel-request.js";

test("LenientFunnelRequest starts in created", () => {
  const item = newLenientFunnelRequest("code-17", "title-931");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFunnelRequest moves to retired", () => {
  const item = newLenientFunnelRequest("code-17", "title-931");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LenientFunnelRequest rejects moves from retired", () => {
  const item = newLenientFunnelRequest("code-17", "title-931");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
