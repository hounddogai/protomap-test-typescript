import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionNotice } from "./conversion-notice.js";

test("ConversionNotice starts in created", () => {
  const item = newConversionNotice("code-87", "label-355");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionNotice moves to validated", () => {
  const item = newConversionNotice("code-87", "label-355");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ConversionNotice rejects moves from retired", () => {
  const item = newConversionNotice("code-87", "label-355");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
