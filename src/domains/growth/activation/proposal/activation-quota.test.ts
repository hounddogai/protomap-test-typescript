import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationQuota } from "./activation-quota.js";

test("ActivationQuota starts in requested", () => {
  const item = newActivationQuota("code-74", "label-809");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationQuota moves to granted", () => {
  const item = newActivationQuota("code-74", "label-809");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ActivationQuota rejects moves from expired", () => {
  const item = newActivationQuota("code-74", "label-809");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
