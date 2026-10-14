import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainDraftView, toDomainDraftViews } from "./domain-draft-view.js";
import { newDomainDraft } from "./domain-draft.js";

test("DomainDraftView shows the status in capitals", () => {
  const item = newDomainDraft("code-151", "label-973");
  const view = toDomainDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainDraftViews([item, item]).length, 2, "views");
});
