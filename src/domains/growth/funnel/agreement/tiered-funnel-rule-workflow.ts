import * as clock from "../../../../kit/clock.js";
import { TieredFunnelRuleValidator, defaultTieredFunnelRuleValidator } from "./tiered-funnel-rule-rules.js";
import { TieredFunnelRuleStore } from "./tiered-funnel-rule-store.js";

/** Moves tiered funnel rules through their life cycle and keeps a journal of what it did. */
export class TieredFunnelRuleService {
  store: TieredFunnelRuleStore;
  validator: TieredFunnelRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredFunnelRuleStore,
    validator: TieredFunnelRuleValidator,
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
      throw new Error(`tiered funnel rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered funnel rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredFunnelRuleService(store: TieredFunnelRuleStore, clockValue: clock.Clock): TieredFunnelRuleService {
  return new TieredFunnelRuleService(store, defaultTieredFunnelRuleValidator(), clockValue, []);
}
