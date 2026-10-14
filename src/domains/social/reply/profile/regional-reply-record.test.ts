import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReplyRecord } from "./regional-reply-record.js";

test("RegionalReplyRecord starts in requested", () => {
  const item = newRegionalReplyRecord("code-586", "title-386");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReplyRecord moves to granted", () => {
  const item = newRegionalReplyRecord("code-586", "title-386");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalReplyRecord rejects moves from expired", () => {
  const item = newRegionalReplyRecord("code-586", "title-386");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
