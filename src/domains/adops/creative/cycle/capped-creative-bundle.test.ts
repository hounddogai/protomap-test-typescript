import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreativeBundle } from "./capped-creative-bundle.js";

test("CappedCreativeBundle starts in open", () => {
  const item = newCappedCreativeBundle("code-447", "label-764");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreativeBundle moves to archived", () => {
  const item = newCappedCreativeBundle("code-447", "label-764");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("CappedCreativeBundle rejects moves from archived", () => {
  const item = newCappedCreativeBundle("code-447", "label-764");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
