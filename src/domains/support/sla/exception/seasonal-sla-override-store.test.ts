import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSlaOverrideStore } from "./seasonal-sla-override-store.js";
import { newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("MemorySeasonalSlaOverrideStore finds what it saved", () => {
  const store = newMemorySeasonalSlaOverrideStore();
  const item = newSeasonalSlaOverride("code-432", "label-164");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
