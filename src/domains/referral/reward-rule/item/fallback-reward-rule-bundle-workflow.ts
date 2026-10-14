import * as clock from "../../../../kit/clock.js";
import {
  FallbackRewardRuleBundleValidator,
  defaultFallbackRewardRuleBundleValidator,
} from "./fallback-reward-rule-bundle-rules.js";
import { FallbackRewardRuleBundleStore } from "./fallback-reward-rule-bundle-store.js";

/** Moves fallback reward rule bundles through their life cycle and keeps a journal of what it did. */
export class FallbackRewardRuleBundleManager {
  store: FallbackRewardRuleBundleStore;
  validator: FallbackRewardRuleBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackRewardRuleBundleStore,
    validator: FallbackRewardRuleBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reward rule bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reward rule bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackRewardRuleBundleManager(store: FallbackRewardRuleBundleStore, clockValue: clock.Clock): FallbackRewardRuleBundleManager {
  return new FallbackRewardRuleBundleManager(store, defaultFallbackRewardRuleBundleValidator(), clockValue, []);
}
