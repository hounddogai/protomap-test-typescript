import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelProfileEngine } from "./funnel-profile-engine.js";
import { newFunnelProfile } from "./funnel-profile.js";

test("FunnelProfileEngine keeps results within bounds", () => {
  const engine = defaultFunnelProfileEngine();
  const item = newFunnelProfile("code-114", "title-925");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
