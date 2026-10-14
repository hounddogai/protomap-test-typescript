import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutTemplateStore } from "./payout-template-store.js";
import { newPayoutTemplate } from "./payout-template.js";

test("MemoryPayoutTemplateStore finds what it saved", () => {
  const store = newMemoryPayoutTemplateStore();
  const item = newPayoutTemplate("code-247", "label-703");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
