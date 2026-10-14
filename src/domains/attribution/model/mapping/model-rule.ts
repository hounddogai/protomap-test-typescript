import * as text from "../../../../kit/text.js";

/** Where a model rule is in its life cycle. */
export type ModelRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a model rule and its current status. */
export class ModelRule {
  code: string;
  name: string;
  floorValue: number;
  attributes: Map<string, string>;
  score: number;
  audienceId: string;
  journeyId: string;
  openRate: number;
  archived: boolean;
  status: ModelRuleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    attributes: Map<string, string>,
    score: number,
    audienceId: string,
    journeyId: string,
    openRate: number,
    archived: boolean,
    status: ModelRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.attributes = attributes;
    this.score = score;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round(this.openRate * this.floorValue * 100) / 100;
  }

  copy(): ModelRule {
    return new ModelRule(
      this.code,
      this.name,
      this.floorValue,
      this.attributes,
      this.score,
      this.audienceId,
      this.journeyId,
      this.openRate,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a model rule in status idle. */
export function newModelRule(code: string, name: string): ModelRule {
  return new ModelRule(code, name, 0, new Map<string, string>(), 0, "", "", 0, false, "idle");
}
