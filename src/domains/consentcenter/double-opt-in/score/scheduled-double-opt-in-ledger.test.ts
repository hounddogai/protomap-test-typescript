import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

test("ScheduledDoubleOptInLedger starts in requested", () => {
  const item = newScheduledDoubleOptInLedger("code-325", "title-61");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDoubleOptInLedger moves to granted", () => {
  const item = newScheduledDoubleOptInLedger("code-325", "title-61");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledDoubleOptInLedger rejects moves from expired", () => {
  const item = newScheduledDoubleOptInLedger("code-325", "title-61");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
