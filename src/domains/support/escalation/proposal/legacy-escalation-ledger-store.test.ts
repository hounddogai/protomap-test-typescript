import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyEscalationLedgerStore } from "./legacy-escalation-ledger-store.js";
import { newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("MemoryLegacyEscalationLedgerStore finds what it saved", () => {
  const store = newMemoryLegacyEscalationLedgerStore();
  const item = newLegacyEscalationLedger("code-334", "label-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
