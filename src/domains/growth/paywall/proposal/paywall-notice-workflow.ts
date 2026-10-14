import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PaywallNoticeEngine, defaultPaywallNoticeEngine } from "./paywall-notice-engine.js";
import { PaywallNoticeValidator, defaultPaywallNoticeValidator } from "./paywall-notice-rules.js";
import { PaywallNoticeStore } from "./paywall-notice-store.js";

/** Moves paywall notices through their life cycle and keeps a journal of what it did. */
export class PaywallNoticeService {
  store: PaywallNoticeStore;
  validator: PaywallNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallNoticeEngine;

  constructor(
    store: PaywallNoticeStore,
    validator: PaywallNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallNoticeEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall notice ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPaywallNoticeService(store: PaywallNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): PaywallNoticeService {
  return new PaywallNoticeService(
    store,
    defaultPaywallNoticeValidator(),
    clockValue,
    [],
    defaultPaywallNoticeEngine(flagsValue),
  );
}
