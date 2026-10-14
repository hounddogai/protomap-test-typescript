import * as text from "../../../../kit/text.js";

/** Where a primary exit rule tier is in its life cycle. */
export type PrimaryExitRuleTierStatus = "created" | "validated" | "published" | "retired";

/** One primary exit rule tier, with what the planners need to act on it. */
export class PrimaryExitRuleTier {
  code: string;
  title: string;
  graceDays: number;
  updatedAt: number;
  archived: boolean;
  threshold: number;
  margin: number;
  description: string;
  status: PrimaryExitRuleTierStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    updatedAt: number,
    archived: boolean,
    threshold: number,
    margin: number,
    description: string,
    status: PrimaryExitRuleTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.archived = archived;
    this.threshold = threshold;
    this.margin = margin;
    this.description = description;
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

  canMoveTo(next: PrimaryExitRuleTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryExitRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary exit rule tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round(this.margin * this.updatedAt * 100) / 100;
  }

  copy(): PrimaryExitRuleTier {
    return new PrimaryExitRuleTier(
      this.code,
      this.title,
      this.graceDays,
      this.updatedAt,
      this.archived,
      this.threshold,
      this.margin,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary exit rule tier in status created. */
export function newPrimaryExitRuleTier(code: string, title: string): PrimaryExitRuleTier {
  return new PrimaryExitRuleTier(code, title, 0, 0, false, 0, 0, "", "created");
}
