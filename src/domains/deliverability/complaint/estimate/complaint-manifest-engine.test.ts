import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintManifestEngine } from "./complaint-manifest-engine.js";
import { newComplaintManifest } from "./complaint-manifest.js";

test("ComplaintManifestEngine keeps results within bounds", () => {
  const engine = defaultComplaintManifestEngine(flags.newRegistry());
  const item = newComplaintManifest("code-116", "name-592");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
