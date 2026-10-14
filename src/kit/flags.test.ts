import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "./flags.js";

test("Flags honors allow lists", () => {
  const registry = flags.newRegistry();
  registry.register(new flags.Flag("beta", true, new flags.AllowListStrategy(["tenant-a"])));
  assert.ok(registry.enabled("beta", "tenant-a"), "tenant-a");
  assert.ok(!registry.enabled("beta", "tenant-b"), "tenant-b");
  assert.ok(!registry.enabled("missing", "tenant-a"), "missing flag");
});
