import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingDomainVarianceView, toRollingDomainVarianceViews } from "./rolling-domain-variance-view.js";
import { newRollingDomainVariance } from "./rolling-domain-variance.js";

test("RollingDomainVarianceView shows the status in capitals", () => {
  const item = newRollingDomainVariance("code-717", "name-737");
  const view = toRollingDomainVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingDomainVarianceViews([item, item]).length, 2, "views");
});
