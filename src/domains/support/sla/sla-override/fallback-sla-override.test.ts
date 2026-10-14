import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSlaOverride } from "./fallback-sla-override.js";

test("FallbackSlaOverride starts in open", () => {
  const item = newFallbackSlaOverride("code-210", "label-52");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSlaOverride moves to archived", () => {
  const item = newFallbackSlaOverride("code-210", "label-52");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackSlaOverride rejects moves from archived", () => {
  const item = newFallbackSlaOverride("code-210", "label-52");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
