import * as clock from "../../../../kit/clock.js";
import {
  RollingPaywallAgreementEngine,
  defaultRollingPaywallAgreementEngine,
} from "./rolling-paywall-agreement-engine.js";
import {
  RollingPaywallAgreementValidator,
  defaultRollingPaywallAgreementValidator,
} from "./rolling-paywall-agreement-rules.js";
import { RollingPaywallAgreementStore } from "./rolling-paywall-agreement-store.js";

/** Moves rolling paywall agreements through their life cycle and keeps a journal of what it did. */
export class RollingPaywallAgreementManager {
  store: RollingPaywallAgreementStore;
  validator: RollingPaywallAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPaywallAgreementEngine;

  constructor(
    store: RollingPaywallAgreementStore,
    validator: RollingPaywallAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPaywallAgreementEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling paywall agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling paywall agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling paywall agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingPaywallAgreementManager(store: RollingPaywallAgreementStore, clockValue: clock.Clock): RollingPaywallAgreementManager {
  return new RollingPaywallAgreementManager(
    store,
    defaultRollingPaywallAgreementValidator(),
    clockValue,
    [],
    defaultRollingPaywallAgreementEngine(),
  );
}
