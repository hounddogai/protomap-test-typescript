import * as text from "../../../../kit/text.js";

/** Where a level baseline is in its life cycle. */
export type LevelBaselineStatus = "created" | "validated" | "published" | "retired";

/** A level baseline. Its code is unique within a tenant. */
export class LevelBaseline {
  code: string;
  title: string;
  windowDays: number;
  archived: boolean;
  locale: string;
  discount: number;
  sequence: number;
  status: LevelBaselineStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    archived: boolean,
    locale: string,
    discount: number,
    sequence: number,
    status: LevelBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.archived = archived;
    this.locale = locale;
    this.discount = discount;
    this.sequence = sequence;
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

  canMoveTo(next: LevelBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LevelBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.discount * this.sequence * 100) / 100;
  }

  copy(): LevelBaseline {
    return new LevelBaseline(
      this.code,
      this.title,
      this.windowDays,
      this.archived,
      this.locale,
      this.discount,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a level baseline in status created. */
export function newLevelBaseline(code: string, title: string): LevelBaseline {
  return new LevelBaseline(code, title, 0, false, "", 0, 0, "created");
}
