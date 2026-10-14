import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCreativeRequestView, toLenientCreativeRequestViews } from "./lenient-creative-request-view.js";
import { newLenientCreativeRequest } from "./lenient-creative-request.js";

test("LenientCreativeRequestView shows the status in capitals", () => {
  const item = newLenientCreativeRequest("code-884", "label-460");
  const view = toLenientCreativeRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCreativeRequestViews([item, item]).length, 2, "views");
});
