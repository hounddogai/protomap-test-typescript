import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWaitPolicyView, toLenientWaitPolicyViews } from "./lenient-wait-policy-view.js";
import { newLenientWaitPolicy } from "./lenient-wait-policy.js";

test("LenientWaitPolicyView shows the status in capitals", () => {
  const item = newLenientWaitPolicy("code-747", "title-80");
  const view = toLenientWaitPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWaitPolicyViews([item, item]).length, 2, "views");
});
