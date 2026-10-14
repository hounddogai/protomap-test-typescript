import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledDomainRequestView, toScheduledDomainRequestViews } from "./scheduled-domain-request-view.js";
import { newScheduledDomainRequest } from "./scheduled-domain-request.js";

test("ScheduledDomainRequestView shows the status in capitals", () => {
  const item = newScheduledDomainRequest("code-927", "name-329");
  const view = toScheduledDomainRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDomainRequestViews([item, item]).length, 2, "views");
});
