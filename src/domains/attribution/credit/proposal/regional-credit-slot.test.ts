import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreditSlot } from "./regional-credit-slot.js";

test("RegionalCreditSlot starts in proposed", () => {
  const item = newRegionalCreditSlot("code-234", "title-332");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreditSlot moves to withdrawn", () => {
  const item = newRegionalCreditSlot("code-234", "title-332");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalCreditSlot rejects moves from withdrawn", () => {
  const item = newRegionalCreditSlot("code-234", "title-332");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
