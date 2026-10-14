import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledDomainGroupView, toScheduledDomainGroupViews } from "./scheduled-domain-group-view.js";
import { newScheduledDomainGroup } from "./scheduled-domain-group.js";

test("ScheduledDomainGroupView shows the status in capitals", () => {
  const item = newScheduledDomainGroup("code-588", "name-953");
  const view = toScheduledDomainGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDomainGroupViews([item, item]).length, 2, "views");
});
