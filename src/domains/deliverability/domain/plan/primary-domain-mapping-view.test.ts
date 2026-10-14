import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryDomainMappingView, toPrimaryDomainMappingViews } from "./primary-domain-mapping-view.js";
import { newPrimaryDomainMapping } from "./primary-domain-mapping.js";

test("PrimaryDomainMappingView shows the status in capitals", () => {
  const item = newPrimaryDomainMapping("code-750", "title-240");
  const view = toPrimaryDomainMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryDomainMappingViews([item, item]).length, 2, "views");
});
