import * as clock from "../../../../kit/clock.js";
import {
  AdaptivePlacementTemplateEngine,
  defaultAdaptivePlacementTemplateEngine,
} from "./adaptive-placement-template-engine.js";
import {
  AdaptivePlacementTemplateValidator,
  defaultAdaptivePlacementTemplateValidator,
} from "./adaptive-placement-template-rules.js";
import { AdaptivePlacementTemplateStore } from "./adaptive-placement-template-store.js";

/** Moves adaptive placement templates through their life cycle and keeps a journal of what it did. */
export class AdaptivePlacementTemplateManager {
  store: AdaptivePlacementTemplateStore;
  validator: AdaptivePlacementTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePlacementTemplateEngine;

  constructor(
    store: AdaptivePlacementTemplateStore,
    validator: AdaptivePlacementTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePlacementTemplateEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newAdaptivePlacementTemplateManager(store: AdaptivePlacementTemplateStore, clockValue: clock.Clock): AdaptivePlacementTemplateManager {
  return new AdaptivePlacementTemplateManager(
    store,
    defaultAdaptivePlacementTemplateValidator(),
    clockValue,
    [],
    defaultAdaptivePlacementTemplateEngine(),
  );
}
