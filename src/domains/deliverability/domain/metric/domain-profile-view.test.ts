import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainProfileView, toDomainProfileViews } from "./domain-profile-view.js";
import { newDomainProfile } from "./domain-profile.js";

test("DomainProfileView shows the status in capitals", () => {
  const item = newDomainProfile("code-441", "label-962");
  const view = toDomainProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainProfileViews([item, item]).length, 2, "views");
});
