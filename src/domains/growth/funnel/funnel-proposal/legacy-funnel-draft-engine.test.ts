import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyFunnelDraftEngine } from "./legacy-funnel-draft-engine.js";
import { newLegacyFunnelDraft } from "./legacy-funnel-draft.js";

test("LegacyFunnelDraftEngine keeps results within bounds", () => {
  const engine = defaultLegacyFunnelDraftEngine();
  const item = newLegacyFunnelDraft("code-832", "label-384");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
