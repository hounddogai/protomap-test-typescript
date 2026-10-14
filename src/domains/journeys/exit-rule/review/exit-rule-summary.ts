import * as text from "../../../../kit/text.js";

/** Where a exit rule summary is in its life cycle. */
export type ExitRuleSummaryStatus = "created" | "validated" | "published" | "retired";

/** A exit rule summary as the exit rule team keeps it. */
export class ExitRuleSummary {
  code: string;
  title: string;
  graceDays: number;
  ownerId: string;
  active: boolean;
  frequencyCap: number;
  attributes: Map<string, string>;
  ceiling: number;
  audienceId: string;
  limit: number;
  status: ExitRuleSummaryStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    ownerId: string,
    active: boolean,
    frequencyCap: number,
    attributes: Map<string, string>,
    ceiling: number,
    audienceId: string,
    limit: number,
    status: ExitRuleSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.audienceId = audienceId;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.frequencyCap * this.graceDays * 100) / 100;
  }

  copy(): ExitRuleSummary {
    return new ExitRuleSummary(
      this.code,
      this.title,
      this.graceDays,
      this.ownerId,
      this.active,
      this.frequencyCap,
      this.attributes,
      this.ceiling,
      this.audienceId,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule summary in status created. */
export function newExitRuleSummary(code: string, title: string): ExitRuleSummary {
  return new ExitRuleSummary(code, title, 0, "", false, 0, new Map<string, string>(), 0, "", 0, "created");
}
