import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionTemplateStore } from "./redemption-template-store.js";
import { newRedemptionTemplate } from "./redemption-template.js";

test("MemoryRedemptionTemplateStore finds what it saved", () => {
  const store = newMemoryRedemptionTemplateStore();
  const item = newRedemptionTemplate("code-311", "title-547");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
