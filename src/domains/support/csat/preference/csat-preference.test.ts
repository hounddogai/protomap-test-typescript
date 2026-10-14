import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatPreference } from "./csat-preference.js";

test("CsatPreference starts in draft", () => {
  const item = newCsatPreference("code-351", "label-388");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatPreference moves to pending", () => {
  const item = newCsatPreference("code-351", "label-388");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CsatPreference rejects moves from closed", () => {
  const item = newCsatPreference("code-351", "label-388");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
