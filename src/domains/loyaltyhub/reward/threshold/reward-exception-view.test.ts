import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardExceptionView, toRewardExceptionViews } from "./reward-exception-view.js";
import { newRewardException } from "./reward-exception.js";

test("RewardExceptionView shows the status in capitals", () => {
  const item = newRewardException("code-63", "label-899");
  const view = toRewardExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardExceptionViews([item, item]).length, 2, "views");
});
