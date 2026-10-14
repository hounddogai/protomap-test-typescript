import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryConversionMappingView,
  toPrimaryConversionMappingViews,
} from "./primary-conversion-mapping-view.js";
import { newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("PrimaryConversionMappingView shows the status in capitals", () => {
  const item = newPrimaryConversionMapping("code-616", "label-774");
  const view = toPrimaryConversionMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryConversionMappingViews([item, item]).length, 2, "views");
});
