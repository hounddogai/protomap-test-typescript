import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainVarianceView, toDomainVarianceViews } from "./domain-variance-view.js";
import { newDomainVariance } from "./domain-variance.js";

test("DomainVarianceView shows the status in capitals", () => {
  const item = newDomainVariance("code-138", "title-977");
  const view = toDomainVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainVarianceViews([item, item]).length, 2, "views");
});
