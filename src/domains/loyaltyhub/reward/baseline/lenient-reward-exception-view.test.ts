import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRewardExceptionView, toLenientRewardExceptionViews } from "./lenient-reward-exception-view.js";
import { newLenientRewardException } from "./lenient-reward-exception.js";

test("LenientRewardExceptionView shows the status in capitals", () => {
  const item = newLenientRewardException("code-682", "label-646");
  const view = toLenientRewardExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRewardExceptionViews([item, item]).length, 2, "views");
});
