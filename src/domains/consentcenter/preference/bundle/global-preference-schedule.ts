import * as text from "../../../../kit/text.js";

/** Where a global preference schedule is in its life cycle. */
export type GlobalPreferenceScheduleStatus = "created" | "validated" | "published" | "retired";

/** A global preference schedule. Its code is unique within a tenant. */
export class GlobalPreferenceSchedule {
  code: string;
  title: string;
  label: string;
  impressions: number;
  utmSource: string;
  status: GlobalPreferenceScheduleStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    impressions: number,
    utmSource: string,
    status: GlobalPreferenceScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.impressions = impressions;
    this.utmSource = utmSource;
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

  canMoveTo(next: GlobalPreferenceScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalPreferenceScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global preference schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): GlobalPreferenceSchedule {
    return new GlobalPreferenceSchedule(
      this.code,
      this.title,
      this.label,
      this.impressions,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global preference schedule in status created. */
export function newGlobalPreferenceSchedule(code: string, title: string): GlobalPreferenceSchedule {
  return new GlobalPreferenceSchedule(code, title, "", 0, "", "created");
}
