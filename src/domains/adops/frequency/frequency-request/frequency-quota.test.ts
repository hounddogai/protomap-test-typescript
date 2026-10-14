import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyQuota } from "./frequency-quota.js";

test("FrequencyQuota starts in proposed", () => {
  const item = newFrequencyQuota("code-36", "title-276");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyQuota moves to approved", () => {
  const item = newFrequencyQuota("code-36", "title-276");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FrequencyQuota rejects moves from withdrawn", () => {
  const item = newFrequencyQuota("code-36", "title-276");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
