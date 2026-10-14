import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionAgreementView, toConversionAgreementViews } from "./conversion-agreement-view.js";
import { newConversionAgreement } from "./conversion-agreement.js";

test("ConversionAgreementView shows the status in capitals", () => {
  const item = newConversionAgreement("code-478", "name-911");
  const view = toConversionAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionAgreementViews([item, item]).length, 2, "views");
});
