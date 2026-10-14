import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCsatTemplate } from "./default-csat-template.js";

test("DefaultCsatTemplate starts in proposed", () => {
  const item = newDefaultCsatTemplate("code-459", "name-707");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCsatTemplate moves to approved", () => {
  const item = newDefaultCsatTemplate("code-459", "name-707");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultCsatTemplate rejects moves from withdrawn", () => {
  const item = newDefaultCsatTemplate("code-459", "name-707");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
