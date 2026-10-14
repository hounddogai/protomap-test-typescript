import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionQuota } from "./conversion-quota.js";

test("ConversionQuota starts in draft", () => {
  const item = newConversionQuota("code-711", "name-72");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionQuota moves to active", () => {
  const item = newConversionQuota("code-711", "name-72");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ConversionQuota rejects moves from closed", () => {
  const item = newConversionQuota("code-711", "name-72");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
