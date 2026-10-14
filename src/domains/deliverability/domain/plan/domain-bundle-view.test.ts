import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainBundleView, toDomainBundleViews } from "./domain-bundle-view.js";
import { newDomainBundle } from "./domain-bundle.js";

test("DomainBundleView shows the status in capitals", () => {
  const item = newDomainBundle("code-609", "title-176");
  const view = toDomainBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainBundleViews([item, item]).length, 2, "views");
});
