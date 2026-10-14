import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainGroupView, toDomainGroupViews } from "./domain-group-view.js";
import { newDomainGroup } from "./domain-group.js";

test("DomainGroupView shows the status in capitals", () => {
  const item = newDomainGroup("code-641", "label-219");
  const view = toDomainGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainGroupViews([item, item]).length, 2, "views");
});
