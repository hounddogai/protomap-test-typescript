import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightDigestView, toFlightDigestViews } from "./flight-digest-view.js";
import { newFlightDigest } from "./flight-digest.js";

test("FlightDigestView shows the status in capitals", () => {
  const item = newFlightDigest("code-762", "name-750");
  const view = toFlightDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightDigestViews([item, item]).length, 2, "views");
});
