import assert from "node:assert/strict";
import { test } from "node:test";
import * as ids from "./ids.js";

test("Ids pads sequence numbers", () => {
  assert.equal(ids.newId("inv", 42), "INV-000042", "id");
  assert.ok(ids.isReference("INV-000042", "inv"), "reference");
});
