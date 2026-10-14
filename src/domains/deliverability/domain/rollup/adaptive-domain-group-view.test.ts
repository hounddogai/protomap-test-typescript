import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveDomainGroupView, toAdaptiveDomainGroupViews } from "./adaptive-domain-group-view.js";
import { newAdaptiveDomainGroup } from "./adaptive-domain-group.js";

test("AdaptiveDomainGroupView shows the status in capitals", () => {
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  const view = toAdaptiveDomainGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDomainGroupViews([item, item]).length, 2, "views");
});
