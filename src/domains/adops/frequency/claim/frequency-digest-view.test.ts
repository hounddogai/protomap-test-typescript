import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyDigestView, toFrequencyDigestViews } from "./frequency-digest-view.js";
import { newFrequencyDigest } from "./frequency-digest.js";

test("FrequencyDigestView shows the status in capitals", () => {
  const item = newFrequencyDigest("code-505", "name-591");
  const view = toFrequencyDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyDigestViews([item, item]).length, 2, "views");
});
