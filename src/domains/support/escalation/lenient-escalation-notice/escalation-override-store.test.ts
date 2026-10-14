import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationOverrideStore } from "./escalation-override-store.js";
import { newEscalationOverride } from "./escalation-override.js";

test("MemoryEscalationOverrideStore finds what it saved", () => {
  const store = newMemoryEscalationOverrideStore();
  const item = newEscalationOverride("code-795", "name-784");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
