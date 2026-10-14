import * as clock from "../../../../kit/clock.js";
import { DefaultDomainTemplateEngine, defaultDefaultDomainTemplateEngine } from "./default-domain-template-engine.js";
import {
  DefaultDomainTemplateValidator,
  defaultDefaultDomainTemplateValidator,
} from "./default-domain-template-rules.js";
import { DefaultDomainTemplateStore } from "./default-domain-template-store.js";

/** Moves default domain templates through their life cycle and keeps a journal of what it did. */
export class DefaultDomainTemplateCoordinator {
  store: DefaultDomainTemplateStore;
  validator: DefaultDomainTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultDomainTemplateEngine;

  constructor(
    store: DefaultDomainTemplateStore,
    validator: DefaultDomainTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultDomainTemplateEngine,
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
      throw new Error(`default domain template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default domain template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default domain template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultDomainTemplateCoordinator(store: DefaultDomainTemplateStore, clockValue: clock.Clock): DefaultDomainTemplateCoordinator {
  return new DefaultDomainTemplateCoordinator(
    store,
    defaultDefaultDomainTemplateValidator(),
    clockValue,
    [],
    defaultDefaultDomainTemplateEngine(),
  );
}
