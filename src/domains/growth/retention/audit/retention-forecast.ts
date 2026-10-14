import * as text from "../../../../kit/text.js";

/** Where a retention forecast is in its life cycle. */
export type RetentionForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A retention forecast as the retention team keeps it. */
export class RetentionForecast {
  code: string;
  title: string;
  label: string;
  openRate: number;
  visible: boolean;
  status: RetentionForecastStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    openRate: number,
    visible: boolean,
    status: RetentionForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.openRate = openRate;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): RetentionForecast {
    return new RetentionForecast(this.code, this.title, this.label, this.openRate, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention forecast in status planned. */
export function newRetentionForecast(code: string, title: string): RetentionForecast {
  return new RetentionForecast(code, title, "", 0, false, "planned");
}
