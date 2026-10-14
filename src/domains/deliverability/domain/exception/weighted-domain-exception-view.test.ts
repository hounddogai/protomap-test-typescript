import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedDomainExceptionView, toWeightedDomainExceptionViews } from "./weighted-domain-exception-view.js";
import { newWeightedDomainException } from "./weighted-domain-exception.js";

test("WeightedDomainExceptionView shows the status in capitals", () => {
  const item = newWeightedDomainException("code-138", "title-913");
  const view = toWeightedDomainExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDomainExceptionViews([item, item]).length, 2, "views");
});
