import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackDomainPolicyView, toFallbackDomainPolicyViews } from "./fallback-domain-policy-view.js";
import { newFallbackDomainPolicy } from "./fallback-domain-policy.js";

test("FallbackDomainPolicyView shows the status in capitals", () => {
  const item = newFallbackDomainPolicy("code-996", "name-669");
  const view = toFallbackDomainPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackDomainPolicyViews([item, item]).length, 2, "views");
});
