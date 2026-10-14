import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveModelTemplateValidator,
  defaultAdaptiveModelTemplateValidator,
} from "./adaptive-model-template-rules.js";
import { AdaptiveModelTemplateStore } from "./adaptive-model-template-store.js";

/** Moves adaptive model templates through their life cycle and keeps a journal of what it did. */
export class AdaptiveModelTemplateCoordinator {
  store: AdaptiveModelTemplateStore;
  validator: AdaptiveModelTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveModelTemplateStore,
    validator: AdaptiveModelTemplateValidator,
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
      throw new Error(`adaptive model template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive model template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveModelTemplateCoordinator(store: AdaptiveModelTemplateStore, clockValue: clock.Clock): AdaptiveModelTemplateCoordinator {
  return new AdaptiveModelTemplateCoordinator(store, defaultAdaptiveModelTemplateValidator(), clockValue, []);
}
