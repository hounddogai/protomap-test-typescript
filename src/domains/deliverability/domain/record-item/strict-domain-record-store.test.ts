import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictDomainRecordStore } from "./strict-domain-record-store.js";
import { newStrictDomainRecord } from "./strict-domain-record.js";

test("MemoryStrictDomainRecordStore finds what it saved", () => {
  const store = newMemoryStrictDomainRecordStore();
  const item = newStrictDomainRecord("code-146", "title-482");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
