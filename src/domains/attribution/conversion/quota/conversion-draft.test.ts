import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionDraft } from "./conversion-draft.js";

test("ConversionDraft starts in requested", () => {
  const item = newConversionDraft("code-237", "label-68");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionDraft moves to granted", () => {
  const item = newConversionDraft("code-237", "label-68");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ConversionDraft rejects moves from expired", () => {
  const item = newConversionDraft("code-237", "label-68");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
