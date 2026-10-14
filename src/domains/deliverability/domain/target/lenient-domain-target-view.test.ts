import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientDomainTargetView, toLenientDomainTargetViews } from "./lenient-domain-target-view.js";
import { newLenientDomainTarget } from "./lenient-domain-target.js";

test("LenientDomainTargetView shows the status in capitals", () => {
  const item = newLenientDomainTarget("code-527", "label-883");
  const view = toLenientDomainTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDomainTargetViews([item, item]).length, 2, "views");
});
