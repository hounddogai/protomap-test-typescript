import * as text from "../../../../kit/text.js";

/** Where a strict window preference is in its life cycle. */
export type StrictWindowPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict window preference, with what the planners need to act on it. */
export class StrictWindowPreference {
  code: string;
  title: string;
  archived: boolean;
  audienceId: string;
  approved: boolean;
  conversionRate: number;
  status: StrictWindowPreferenceStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    audienceId: string,
    approved: boolean,
    conversionRate: number,
    status: StrictWindowPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.audienceId = audienceId;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictWindowPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictWindowPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict window preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): StrictWindowPreference {
    return new StrictWindowPreference(
      this.code,
      this.title,
      this.archived,
      this.audienceId,
      this.approved,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict window preference in status new. */
export function newStrictWindowPreference(code: string, title: string): StrictWindowPreference {
  return new StrictWindowPreference(code, title, false, "", false, 0, "new");
}
