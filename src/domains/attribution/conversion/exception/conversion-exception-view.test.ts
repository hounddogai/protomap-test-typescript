import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionExceptionView, toConversionExceptionViews } from "./conversion-exception-view.js";
import { newConversionException } from "./conversion-exception.js";

test("ConversionExceptionView shows the status in capitals", () => {
  const item = newConversionException("code-213", "name-534");
  const view = toConversionExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionExceptionViews([item, item]).length, 2, "views");
});
