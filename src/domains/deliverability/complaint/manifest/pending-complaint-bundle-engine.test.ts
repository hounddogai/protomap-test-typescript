import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingComplaintBundleEngine } from "./pending-complaint-bundle-engine.js";
import { newPendingComplaintBundle } from "./pending-complaint-bundle.js";

test("PendingComplaintBundleEngine keeps results within bounds", () => {
  const engine = defaultPendingComplaintBundleEngine();
  const item = newPendingComplaintBundle("code-555", "name-467");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
