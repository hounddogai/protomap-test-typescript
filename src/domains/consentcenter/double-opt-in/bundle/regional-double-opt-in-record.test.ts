import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalDoubleOptInRecord } from "./regional-double-opt-in-record.js";

test("RegionalDoubleOptInRecord starts in requested", () => {
  const item = newRegionalDoubleOptInRecord("code-162", "title-862");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalDoubleOptInRecord moves to granted", () => {
  const item = newRegionalDoubleOptInRecord("code-162", "title-862");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalDoubleOptInRecord rejects moves from expired", () => {
  const item = newRegionalDoubleOptInRecord("code-162", "title-862");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
