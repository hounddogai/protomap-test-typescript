import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderBundleEngine } from "./sender-bundle-engine.js";
import { newSenderBundle } from "./sender-bundle.js";

test("SenderBundleEngine keeps results within bounds", () => {
  const engine = defaultSenderBundleEngine();
  const item = newSenderBundle("code-213", "label-207");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
