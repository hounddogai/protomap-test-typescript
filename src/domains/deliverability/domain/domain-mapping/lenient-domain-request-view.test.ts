import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientDomainRequestView, toLenientDomainRequestViews } from "./lenient-domain-request-view.js";
import { newLenientDomainRequest } from "./lenient-domain-request.js";

test("LenientDomainRequestView shows the status in capitals", () => {
  const item = newLenientDomainRequest("code-31", "name-633");
  const view = toLenientDomainRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDomainRequestViews([item, item]).length, 2, "views");
});
