import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDomainRecordStore } from "./scheduled-domain-record-store.js";
import { newScheduledDomainRecord } from "./scheduled-domain-record.js";

test("MemoryScheduledDomainRecordStore finds what it saved", () => {
  const store = newMemoryScheduledDomainRecordStore();
  const item = newScheduledDomainRecord("code-914", "title-216");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
