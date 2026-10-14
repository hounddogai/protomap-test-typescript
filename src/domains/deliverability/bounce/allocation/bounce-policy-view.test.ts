import assert from "node:assert/strict";
import { test } from "node:test";
import { toBouncePolicyView, toBouncePolicyViews } from "./bounce-policy-view.js";
import { newBouncePolicy } from "./bounce-policy.js";

test("BouncePolicyView shows the status in capitals", () => {
  const item = newBouncePolicy("code-305", "name-752");
  const view = toBouncePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBouncePolicyViews([item, item]).length, 2, "views");
});
