import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

test("RegionalNudgeSnapshot starts in requested", () => {
  const item = newRegionalNudgeSnapshot("code-132", "label-391");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalNudgeSnapshot moves to granted", () => {
  const item = newRegionalNudgeSnapshot("code-132", "label-391");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalNudgeSnapshot rejects moves from expired", () => {
  const item = newRegionalNudgeSnapshot("code-132", "label-391");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
