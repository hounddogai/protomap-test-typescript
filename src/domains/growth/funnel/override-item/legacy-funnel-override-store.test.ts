import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFunnelOverrideStore } from "./legacy-funnel-override-store.js";
import { newLegacyFunnelOverride } from "./legacy-funnel-override.js";

test("MemoryLegacyFunnelOverrideStore finds what it saved", () => {
  const store = newMemoryLegacyFunnelOverrideStore();
  const item = newLegacyFunnelOverride("code-319", "title-818");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
