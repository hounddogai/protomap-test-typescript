import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledCreditBundleStore } from "./scheduled-credit-bundle-store.js";
import { newScheduledCreditBundle } from "./scheduled-credit-bundle.js";

test("MemoryScheduledCreditBundleStore finds what it saved", () => {
  const store = newMemoryScheduledCreditBundleStore();
  const item = newScheduledCreditBundle("code-723", "title-924");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
