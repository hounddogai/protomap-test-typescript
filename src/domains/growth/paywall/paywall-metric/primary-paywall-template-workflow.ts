import * as clock from "../../../../kit/clock.js";
import {
  PrimaryPaywallTemplateEngine,
  defaultPrimaryPaywallTemplateEngine,
} from "./primary-paywall-template-engine.js";
import {
  PrimaryPaywallTemplateValidator,
  defaultPrimaryPaywallTemplateValidator,
} from "./primary-paywall-template-rules.js";
import { PrimaryPaywallTemplateStore } from "./primary-paywall-template-store.js";

/** Moves primary paywall templates through their life cycle and keeps a journal of what it did. */
export class PrimaryPaywallTemplateManager {
  store: PrimaryPaywallTemplateStore;
  validator: PrimaryPaywallTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryPaywallTemplateEngine;

  constructor(
    store: PrimaryPaywallTemplateStore,
    validator: PrimaryPaywallTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryPaywallTemplateEngine,
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
      throw new Error(`primary paywall template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary paywall template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary paywall template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryPaywallTemplateManager(store: PrimaryPaywallTemplateStore, clockValue: clock.Clock): PrimaryPaywallTemplateManager {
  return new PrimaryPaywallTemplateManager(
    store,
    defaultPrimaryPaywallTemplateValidator(),
    clockValue,
    [],
    defaultPrimaryPaywallTemplateEngine(),
  );
}
