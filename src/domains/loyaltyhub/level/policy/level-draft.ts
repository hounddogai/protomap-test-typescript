import * as text from "../../../../kit/text.js";

/** Where a level draft is in its life cycle. */
export type LevelDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A level draft. Its code is unique within a tenant. */
export class LevelDraft {
  code: string;
  title: string;
  active: boolean;
  weight: number;
  label: string;
  status: LevelDraftStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    weight: number,
    label: string,
    status: LevelDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.weight = weight;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"level draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): LevelDraft {
    return new LevelDraft(this.code, this.title, this.active, this.weight, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a level draft in status proposed. */
export function newLevelDraft(code: string, title: string): LevelDraft {
  return new LevelDraft(code, title, false, 0, "", "proposed");
}
