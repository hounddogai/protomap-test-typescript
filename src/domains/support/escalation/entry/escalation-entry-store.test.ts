import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationEntryStore } from "./escalation-entry-store.js";
import { newEscalationEntry } from "./escalation-entry.js";

test("MemoryEscalationEntryStore finds what it saved", () => {
  const store = newMemoryEscalationEntryStore();
  const item = newEscalationEntry("code-927", "name-789");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
