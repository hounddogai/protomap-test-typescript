import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PaywallTemplateEngine, defaultPaywallTemplateEngine } from "./paywall-template-engine.js";
import { PaywallTemplateValidator, defaultPaywallTemplateValidator } from "./paywall-template-rules.js";
import { PaywallTemplateStore } from "./paywall-template-store.js";

/** Moves paywall templates through their life cycle and keeps a journal of what it did. */
export class PaywallTemplateDesk {
  store: PaywallTemplateStore;
  validator: PaywallTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallTemplateEngine;

  constructor(
    store: PaywallTemplateStore,
    validator: PaywallTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallTemplateEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPaywallTemplateDesk(store: PaywallTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PaywallTemplateDesk {
  return new PaywallTemplateDesk(
    store,
    defaultPaywallTemplateValidator(),
    clockValue,
    [],
    defaultPaywallTemplateEngine(flagsValue),
  );
}
