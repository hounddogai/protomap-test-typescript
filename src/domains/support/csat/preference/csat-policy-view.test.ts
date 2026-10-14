import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatPolicyView, toCsatPolicyViews } from "./csat-policy-view.js";
import { newCsatPolicy } from "./csat-policy.js";

test("CsatPolicyView shows the status in capitals", () => {
  const item = newCsatPolicy("code-74", "title-136");
  const view = toCsatPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatPolicyViews([item, item]).length, 2, "views");
});
