import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainBaselineView, toDomainBaselineViews } from "./domain-baseline-view.js";
import { newDomainBaseline } from "./domain-baseline.js";

test("DomainBaselineView shows the status in capitals", () => {
  const item = newDomainBaseline("code-775", "title-209");
  const view = toDomainBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainBaselineViews([item, item]).length, 2, "views");
});
