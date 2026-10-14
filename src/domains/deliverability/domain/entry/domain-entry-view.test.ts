import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainEntryView, toDomainEntryViews } from "./domain-entry-view.js";
import { newDomainEntry } from "./domain-entry.js";

test("DomainEntryView shows the status in capitals", () => {
  const item = newDomainEntry("code-247", "name-817");
  const view = toDomainEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainEntryViews([item, item]).length, 2, "views");
});
