import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedDomainEntryView, toCappedDomainEntryViews } from "./capped-domain-entry-view.js";
import { newCappedDomainEntry } from "./capped-domain-entry.js";

test("CappedDomainEntryView shows the status in capitals", () => {
  const item = newCappedDomainEntry("code-856", "name-165");
  const view = toCappedDomainEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedDomainEntryViews([item, item]).length, 2, "views");
});
