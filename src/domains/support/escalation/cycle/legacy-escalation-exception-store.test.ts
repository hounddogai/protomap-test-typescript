import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyEscalationExceptionStore } from "./legacy-escalation-exception-store.js";
import { newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("MemoryLegacyEscalationExceptionStore finds what it saved", () => {
  const store = newMemoryLegacyEscalationExceptionStore();
  const item = newLegacyEscalationException("code-597", "title-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
