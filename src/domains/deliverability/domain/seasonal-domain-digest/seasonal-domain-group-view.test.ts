import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalDomainGroupView, toSeasonalDomainGroupViews } from "./seasonal-domain-group-view.js";
import { newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("SeasonalDomainGroupView shows the status in capitals", () => {
  const item = newSeasonalDomainGroup("code-733", "title-448");
  const view = toSeasonalDomainGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDomainGroupViews([item, item]).length, 2, "views");
});
