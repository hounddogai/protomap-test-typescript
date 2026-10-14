import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFunnelBundleStore } from "./strict-funnel-bundle-store.js";
import { newStrictFunnelBundle } from "./strict-funnel-bundle.js";

test("MemoryStrictFunnelBundleStore finds what it saved", () => {
  const store = newMemoryStrictFunnelBundleStore();
  const item = newStrictFunnelBundle("code-41", "title-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
