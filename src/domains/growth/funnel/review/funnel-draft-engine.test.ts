import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelDraftEngine } from "./funnel-draft-engine.js";
import { newFunnelDraft } from "./funnel-draft.js";

test("FunnelDraftEngine keeps results within bounds", () => {
  const engine = defaultFunnelDraftEngine();
  const item = newFunnelDraft("code-170", "name-383");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
