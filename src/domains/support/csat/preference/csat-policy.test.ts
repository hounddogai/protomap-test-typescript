import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatPolicy } from "./csat-policy.js";

test("CsatPolicy starts in proposed", () => {
  const item = newCsatPolicy("code-74", "title-136");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatPolicy moves to approved", () => {
  const item = newCsatPolicy("code-74", "title-136");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CsatPolicy rejects moves from withdrawn", () => {
  const item = newCsatPolicy("code-74", "title-136");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
