import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainTierView, toDomainTierViews } from "./domain-tier-view.js";
import { newDomainTier } from "./domain-tier.js";

test("DomainTierView shows the status in capitals", () => {
  const item = newDomainTier("code-409", "label-973");
  const view = toDomainTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainTierViews([item, item]).length, 2, "views");
});
