import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyPolicyView, toFrequencyPolicyViews } from "./frequency-policy-view.js";
import { newFrequencyPolicy } from "./frequency-policy.js";

test("FrequencyPolicyView shows the status in capitals", () => {
  const item = newFrequencyPolicy("code-261", "title-530");
  const view = toFrequencyPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyPolicyViews([item, item]).length, 2, "views");
});
