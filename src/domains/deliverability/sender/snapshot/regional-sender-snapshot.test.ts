import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("RegionalSenderSnapshot starts in proposed", () => {
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderSnapshot moves to rejected", () => {
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalSenderSnapshot rejects moves from withdrawn", () => {
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
