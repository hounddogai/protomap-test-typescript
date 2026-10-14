import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatBundle } from "./csat-bundle.js";

test("CsatBundle starts in new", () => {
  const item = newCsatBundle("code-250", "title-530");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatBundle moves to queued", () => {
  const item = newCsatBundle("code-250", "title-530");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CsatBundle rejects moves from failed", () => {
  const item = newCsatBundle("code-250", "title-530");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
