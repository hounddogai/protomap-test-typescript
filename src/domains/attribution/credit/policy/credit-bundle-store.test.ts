import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditBundleStore } from "./credit-bundle-store.js";
import { newCreditBundle } from "./credit-bundle.js";

test("MemoryCreditBundleStore finds what it saved", () => {
  const store = newMemoryCreditBundleStore();
  const item = newCreditBundle("code-87", "title-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
