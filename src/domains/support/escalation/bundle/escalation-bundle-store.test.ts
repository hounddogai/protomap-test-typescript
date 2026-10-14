import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationBundleStore } from "./escalation-bundle-store.js";
import { newEscalationBundle } from "./escalation-bundle.js";

test("MemoryEscalationBundleStore finds what it saved", () => {
  const store = newMemoryEscalationBundleStore();
  const item = newEscalationBundle("code-717", "label-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
