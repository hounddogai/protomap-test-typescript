import * as clock from "../../../../kit/clock.js";
import {
  PrimaryActivationTemplateValidator,
  defaultPrimaryActivationTemplateValidator,
} from "./primary-activation-template-rules.js";
import { PrimaryActivationTemplateStore } from "./primary-activation-template-store.js";

/** Moves primary activation templates through their life cycle and keeps a journal of what it did. */
export class PrimaryActivationTemplateCoordinator {
  store: PrimaryActivationTemplateStore;
  validator: PrimaryActivationTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryActivationTemplateStore,
    validator: PrimaryActivationTemplateValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newPrimaryActivationTemplateCoordinator(store: PrimaryActivationTemplateStore, clockValue: clock.Clock): PrimaryActivationTemplateCoordinator {
  return new PrimaryActivationTemplateCoordinator(store, defaultPrimaryActivationTemplateValidator(), clockValue, []);
}
