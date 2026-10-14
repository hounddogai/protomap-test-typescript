import * as text from "../../../../kit/text.js";

/** Where a default preference schedule is in its life cycle. */
export type DefaultPreferenceScheduleStatus = "created" | "validated" | "published" | "retired";

/** One default preference schedule, with what the planners need to act on it. */
export class DefaultPreferenceSchedule {
  code: string;
  title: string;
  clicks: number;
  weight: number;
  audienceId: string;
  variant: string;
  limit: number;
  status: DefaultPreferenceScheduleStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    weight: number,
    audienceId: string,
    variant: string,
    limit: number,
    status: DefaultPreferenceScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.weight = weight;
    this.audienceId = audienceId;
    this.variant = variant;
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

  canMoveTo(next: DefaultPreferenceScheduleStatus): boolean {
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPreferenceScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default preference schedule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.limit - this.weight) * 100) / 100;
  }

  copy(): DefaultPreferenceSchedule {
    return new DefaultPreferenceSchedule(
      this.code,
      this.title,
      this.clicks,
      this.weight,
      this.audienceId,
      this.variant,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default preference schedule in status created. */
export function newDefaultPreferenceSchedule(code: string, title: string): DefaultPreferenceSchedule {
  return new DefaultPreferenceSchedule(code, title, 0, 0, "", "", 0, "created");
}
